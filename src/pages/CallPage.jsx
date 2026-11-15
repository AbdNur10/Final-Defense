// frontend/src/pages/CallPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { ArrowLeft, Camera, CameraOff, Mic, MicOff, PhoneOff, RefreshCw } from "lucide-react";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./OneToOneCall.css";
import toast from "react-hot-toast";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "xgqw23kv3tdt";

export default function CallPage() {
  const { id: callId } = useParams();
  const [searchParams] = useSearchParams();
  const isAudioOnly = searchParams.get("audioOnly") === "true";
  const navigate = useNavigate();
  const { authUser, isLoading } = useAuthUser();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callError, setCallError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [facingMode, setFacingMode] = useState("user");

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (isLoading || tokenLoading) return;

    let active = true;
    let videoClient;
    let callInstance;

    const initCall = async () => {
      if (!tokenData?.token || !authUser || !callId) {
        setCallError(tokenError?.response?.data?.message || "Call credentials are unavailable.");
        setIsConnecting(false);
        return;
      }

      try {
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePicture,
        };

        videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        if (isAudioOnly) {
          await callInstance.camera.disable();
          setIsVideoOff(true);
        } else {
          try {
            await callInstance.camera.enable();
            setIsVideoOff(false);
          } catch {
            setIsVideoOff(true);
            toast.error("Allow camera access to share video");
          }
        }

        try {
          await callInstance.microphone.enable();
          setIsMuted(false);
        } catch {
          setIsMuted(true);
          toast.error("Allow microphone access to speak in the call");
        }

        if (active) {
          setCallError("");
          setClient(videoClient);
          setCall(callInstance);
        } else {
          await callInstance.leave();
          await videoClient.disconnectUser();
        }
      } catch (error) {
        console.error("Error joining one-to-one call:", error);
        if (active) {
          setCallError(error.response?.data?.message || error.message || "Could not join the call.");
          toast.error("Could not join the call. Check your connection and try again.");
        }
      } finally {
        if (active) setIsConnecting(false);
      }
    };

    void initCall();

    return () => {
      active = false;
      if (callInstance) void callInstance.leave().catch(() => {});
      if (videoClient) void videoClient.disconnectUser().catch(() => {});
    };
  }, [isLoading, tokenLoading, tokenData?.token, tokenError, authUser?._id, authUser?.fullName, authUser?.profilePicture, callId, isAudioOnly]);

  const toggleMute = async () => {
    if (!call) return;
    try {
      if (isMuted) {
        await call.microphone.enable();
        setIsMuted(false);
      } else {
        await call.microphone.disable();
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Microphone toggle error:", error);
      toast.error("Could not change microphone state");
    }
  };

  const toggleVideo = async () => {
    if (!call || isAudioOnly) return;
    try {
      if (isVideoOff) {
        await call.camera.enable();
        setIsVideoOff(false);
      } else {
        await call.camera.disable();
        setIsVideoOff(true);
      }
    } catch (error) {
      console.error("Camera toggle error:", error);
      toast.error("Could not change camera state");
    }
  };

  const toggleCamera = async () => {
    if (!call || isAudioOnly || isVideoOff) return;

    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);

      await call.camera.disable();
      await new Promise((resolve) => setTimeout(resolve, 300));
      await call.camera.enable({
        video: { facingMode: newFacingMode }
      });
      
      toast.success(`Switched to ${newFacingMode === "user" ? "Front" : "Back"} camera`);
    } catch (error) {
      console.error("Camera switch error:", error);
      toast.error("Failed to switch camera");
      try { await call.camera.enable(); } catch { /* Camera remains unavailable. */ }
    }
  };

  const handleLeave = async () => {
    if (call) {
      try {
        await call.leave();
      } catch (error) {
        console.error("Error leaving call:", error);
      }
    }
    navigate(-1);
  };

  if (isLoading || tokenLoading || isConnecting) {
    return (
      <div className="one-call-state">
        <span className="loading loading-spinner loading-md" />
        <p>Connecting to your call…</p>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="one-call-state">
        <div className="one-call-state__message">
          <p className="one-call-state__eyebrow">CALL UNAVAILABLE</p>
          <h1>Couldn’t join the call.</h1>
          <p>{callError || "Check your connection and try again."}</p>
          <button onClick={() => navigate(-1)} className="one-call-back">
            <ArrowLeft size={16} /> Back to conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="one-call-page">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <header className="one-call-header">
            <button className="one-call-back-button" onClick={handleLeave} aria-label="Leave call">
              <ArrowLeft size={17} />
            </button>
            <div className="one-call-header__title">
              <span className="one-call-live-dot" />
              <div>
                <h1>{isAudioOnly ? "Audio call" : "Video call"}</h1>
                <p>One-to-one conversation</p>
              </div>
            </div>
            <span className="one-call-secure-label">KYAU CHAT</span>
          </header>

          <main className="one-call-stage">
            <SpeakerLayout />
          </main>

          <footer className="one-call-controls-area">
            <div className="one-call-toolbar" role="toolbar" aria-label="Call controls">
              <button
                className={`one-call-control ${isMuted ? "is-muted" : ""}`}
                onClick={toggleMute}
                aria-label={isMuted ? "Turn microphone on" : "Turn microphone off"}
                aria-pressed={isMuted}
                title={isMuted ? "Turn microphone on" : "Turn microphone off"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              {!isAudioOnly && (
                <button
                  className={`one-call-control ${isVideoOff ? "is-muted" : ""}`}
                  onClick={toggleVideo}
                  aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
                  aria-pressed={isVideoOff}
                  title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                >
                  {isVideoOff ? <CameraOff size={20} /> : <Camera size={20} />}
                  <span>{isVideoOff ? "Camera on" : "Camera off"}</span>
                </button>
              )}

              {!isAudioOnly && (
                <button
                  className="one-call-control one-call-control--compact"
                  onClick={toggleCamera}
                  disabled={isVideoOff}
                  aria-label={`Switch to ${facingMode === "user" ? "back" : "front"} camera`}
                  title={`Switch to ${facingMode === "user" ? "back" : "front"} camera`}
                >
                  <RefreshCw size={19} />
                  <span>Flip</span>
                </button>
              )}

              <button className="one-call-control one-call-control--end" onClick={handleLeave} aria-label="End call" title="End call">
                <PhoneOff size={20} />
                <span>End</span>
              </button>
            </div>
            <p className="one-call-controls-hint">Your controls stay here while people join.</p>
          </footer>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}