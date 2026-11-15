// frontend/src/pages/GroupCallPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  PaginatedGridLayout,
} from "@stream-io/video-react-sdk";
import {
  Camera,
  CameraOff,
  Circle,
  Grid2X2,
  Mic,
  MicOff,
  MonitorUp,
  PanelsTopLeft,
  PhoneOff,
  RefreshCw,
  Smile,
  StopCircle,
  Users,
} from "lucide-react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./GroupCall.css";
import toast from "react-hot-toast";

const STREAM_API_KEY = "xgqw23kv3tdt";

export default function GroupCallPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAudioOnly = searchParams.get("audioOnly") === "true";
  const { authUser, isLoading: authLoading } = useAuthUser();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Call duration timer
  useEffect(() => {
    if (callStartedAt) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartedAt) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStartedAt]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ FIXED: Toggle Camera (Front/Back)
  const toggleCamera = async () => {
    if (!call) return;

    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);

      // Turn off camera first
      await call.camera.disable();

      // Small delay to ensure camera is fully disabled
      await new Promise(resolve => setTimeout(resolve, 300));

      // Enable camera with new facing mode
      await call.camera.enable({
        video: { facingMode: newFacingMode }
      });
      
      toast.success(`Switched to ${newFacingMode === "user" ? "Front" : "Back"} camera`);
    } catch (error) {
      console.error("Camera switch error:", error);
      toast.error("Failed to switch camera");
      
      // Try to re-enable camera if it failed
      try {
        await call.camera.enable();
      } catch (e) {
        console.error("Failed to re-enable camera:", e);
      }
    }
  };

  // Initialize the video client once credentials and the signed-in user are ready.
  useEffect(() => {
    if (authLoading || tokenLoading || !authUser) return;

    if (!tokenData?.token) {
      setJoinError(tokenError || new Error("A call token could not be loaded."));
      setIsJoining(false);
      return;
    }

    let active = true;
    let videoClient;
    let callInstance;

    const updateParticipantCount = () => {
      const participants = callInstance?.state.participants;
      if (!participants) return;
      setParticipantCount(
        Array.isArray(participants) ? participants.length : Object.keys(participants).length
      );
    };

    const handleCustomEvent = (event) => {
      if (event.type !== "reaction") return;
      const reactionId = `${Date.now()}-${Math.random()}`;
      setReactionsList((current) => [...current, { reaction: event.reaction, id: reactionId }]);
      setTimeout(() => {
        setReactionsList((current) => current.filter((reaction) => reaction.id !== reactionId));
      }, 2000);
    };

    const joinCall = async () => {
      setIsJoining(true);
      setJoinError(null);
      setClient(null);
      setCall(null);

      try {
        videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePicture,
          },
          token: tokenData.token,
        });

        callInstance = videoClient.call("default", groupId);
        await callInstance.join({ create: true });

        if (!active) {
          await callInstance.leave();
          await videoClient.disconnectUser();
          return;
        }

        setCallStartedAt(Date.now());

        try {
          await callInstance.microphone.enable();
          setIsMuted(false);
        } catch {
          setIsMuted(true);
          toast.error("Allow microphone access to speak in the call");
        }

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

        callInstance.on("participant-joined", updateParticipantCount);
        callInstance.on("participant-left", updateParticipantCount);
        callInstance.on("custom", handleCustomEvent);
        updateParticipantCount();
        setClient(videoClient);
        setCall(callInstance);
        toast.success(`Connected to ${isAudioOnly ? "audio" : "video"} call`);
      } catch (error) {
        console.error("Join call error:", error);
        if (active) {
          setJoinError(error);
          toast.error("Could not join the call. Check your connection and try again.");
        }
      } finally {
        if (active) setIsJoining(false);
      }
    };

    void joinCall();

    return () => {
      active = false;
      if (callInstance) {
        callInstance.off("participant-joined", updateParticipantCount);
        callInstance.off("participant-left", updateParticipantCount);
        callInstance.off("custom", handleCustomEvent);
        void callInstance.leave().catch(() => {});
      }
      if (videoClient) {
        void videoClient.disconnectUser().catch(() => {});
      }
    };
  }, [authLoading, authUser?._id, authUser?.fullName, authUser?.profilePicture, tokenData?.token, tokenError, tokenLoading, groupId, isAudioOnly]);

  useEffect(() => () => {
    screenShareStream?.getTracks().forEach((track) => track.stop());
  }, [screenShareStream]);

  const toggleMute = async () => {
    if (call) {
      if (isMuted) {
        await call.microphone.enable();
        toast.success("Mic unmuted");
      } else {
        await call.microphone.disable();
        toast.success("Mic muted");
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (call && !isAudioOnly) {
      if (isVideoOff) {
        await call.camera.enable();
        toast.success("Camera on");
      } else {
        await call.camera.disable();
        toast.success("Camera off");
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  // Screen Share using browser's native API
  const toggleScreenShare = async () => {
    if (!call) return;
    
    try {
      if (isScreenSharing) {
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop());
          setScreenShareStream(null);
        }
        if (!isVideoOff) {
          await call.camera.enable();
        }
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenShareStream(stream);
        
        const videoTrack = stream.getVideoTracks()[0];
        await call.publishVideoStream(videoTrack);
        await call.camera.disable();
        
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
        
        videoTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (err) {
      console.error("Screen share error:", err);
      toast.error("Screen share cancelled or failed");
    }
  };

  // Recording using browser's MediaRecorder API
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const toggleRecording = async () => {
    if (!call) return;
    
    try {
      if (isRecording) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        setIsRecording(false);
        toast.success("Recording stopped. Saving...");
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `call-recording-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Recording saved!");
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start(1000);
        setMediaRecorder(recorder);
        setRecordedChunks(chunks);
        setIsRecording(true);
        toast.success("Recording started");
      }
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Recording failed");
    }
  };

  const sendReaction = (reaction) => {
    if (call) {
      call.sendCustomEvent({ type: "reaction", reaction });
      setShowReactions(false);
      toast.success(`Sent ${reaction}`);
    }
  };

  const handleEndCall = async () => {
    if (isScreenSharing && screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
    }
    if (call) {
      await call.leave();
      toast.success("Call ended");
    }
    navigate(`/groups/${groupId}`);
  };

  if (authLoading || tokenLoading || isJoining) {
    return (
      <div className="group-call-state">
        <span className="loading loading-spinner loading-md" />
        <p>Joining group call…</p>
      </div>
    );
  }

  if (joinError || !client || !call) {
    return (
      <div className="group-call-state">
        <div className="group-call-state__message">
          <p className="group-call-state__eyebrow">CALL UNAVAILABLE</p>
          <h1>Couldn’t join the group call.</h1>
          <p>
            {joinError?.response?.data?.message || joinError?.message || "The call could not be initialized."}
          </p>
          <button className="group-call-back" onClick={() => navigate(`/groups/${groupId}`)}>
            Return to group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-call-page">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <header className="group-call-header">
            <div className="group-call-heading">
              <span className="group-call-mark"><Users size={19} aria-hidden="true" /></span>
              <div>
                <p className="group-call-eyebrow">KYAU / LIVE ROOM</p>
                <h1>{isAudioOnly ? "Group audio" : "Group video"}</h1>
              </div>
            </div>

            <div className="group-call-meta">
              <span className="group-call-live"><i /> LIVE</span>
              <span className="group-call-meta__item"><Users size={15} /> {participantCount} {participantCount === 1 ? "participant" : "participants"}</span>
              <span className="group-call-meta__item group-call-duration">{formatDuration(callDuration)}</span>
            </div>
          </header>

          <main className="group-call-stage">
            {participantCount <= 2 ? (
              <SpeakerLayout participantsBarPosition="bottom" />
            ) : (
              <PaginatedGridLayout />
            )}
          </main>

          <footer className="group-call-footer">
            <div className="group-call-toolbar" role="toolbar" aria-label="Group call controls">
              <button
                onClick={toggleMute}
                className={`group-call-control ${isMuted ? "is-active" : ""}`}
                aria-label={isMuted ? "Turn microphone on" : "Turn microphone off"}
                aria-pressed={isMuted}
                title={isMuted ? "Turn microphone on" : "Turn microphone off"}
              >
                {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                <span>{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              {!isAudioOnly && (
                <button
                  onClick={toggleVideo}
                  className={`group-call-control ${isVideoOff ? "is-active" : ""}`}
                  aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
                  aria-pressed={isVideoOff}
                  title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                >
                  {isVideoOff ? <CameraOff size={19} /> : <Camera size={19} />}
                  <span>{isVideoOff ? "Camera on" : "Camera off"}</span>
                </button>
              )}

              <button
                onClick={toggleCamera}
                className="group-call-control group-call-control--compact"
                title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
                aria-label={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
              >
                <RefreshCw size={18} />
                <span>Flip</span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`group-call-control ${isScreenSharing ? "is-active" : ""}`}
                aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
                aria-pressed={isScreenSharing}
                title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
              >
                <MonitorUp size={19} />
                <span>{isScreenSharing ? "Stop share" : "Share screen"}</span>
              </button>

              <button
                onClick={toggleRecording}
                className={`group-call-control ${isRecording ? "is-recording" : ""}`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                aria-pressed={isRecording}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <StopCircle size={19} /> : <Circle size={19} />}
                <span>{isRecording ? "Stop record" : "Record"}</span>
              </button>

              <button
                onClick={() => setShowReactions(!showReactions)}
                className={`group-call-control ${showReactions ? "is-active" : ""}`}
                aria-label="Toggle reactions"
                aria-expanded={showReactions}
                title="Reactions"
              >
                <Smile size={19} />
                <span>React</span>
              </button>

              <button
                onClick={() => setLayout(layout === "grid" ? "speaker" : "grid")}
                className="group-call-control group-call-control--compact"
                aria-label={layout === "grid" ? "Switch to speaker view" : "Switch to grid view"}
                title={layout === "grid" ? "Switch to speaker view" : "Switch to grid view"}
              >
                {layout === "grid" ? <PanelsTopLeft size={18} /> : <Grid2X2 size={18} />}
                <span>Layout</span>
              </button>

              <button onClick={handleEndCall} className="group-call-control group-call-control--end" aria-label="Leave group call" title="Leave call">
                <PhoneOff size={19} />
                <span>Leave</span>
              </button>
            </div>

            {showReactions && (
              <div className="group-call-reactions" aria-label="Choose a reaction">
                {["👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🔥"].map((emoji) => (
                  <button key={emoji} onClick={() => sendReaction(emoji)} title={`Send ${emoji}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {reactionsList.map((r) => (
              <div key={r.id} className="group-call-reaction-float">
                {r.reaction}
              </div>
            ))}

            <div className="group-call-status" aria-live="polite">
              <span className={isMuted ? "is-off" : ""}>{isMuted ? "Mic off" : "Mic on"}</span>
              {!isAudioOnly && <span className={isVideoOff ? "is-off" : ""}>{isVideoOff ? "Camera off" : "Camera on"}</span>}
              {isScreenSharing && <span className="is-live">Screen sharing</span>}
              {isRecording && <span className="is-recording-status">Recording</span>}
            </div>
          </footer>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}