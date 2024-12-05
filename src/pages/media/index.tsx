export default function VideoComp() {
  const videoRef = useRef(null)

  return (
    <div>
      <video ref={videoRef} controls>
        <source
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          type="video/mp4"
        />
        <track label="Subtitle" src="" default kind="subtitles" />
      </video>

      {/* Video as GIF image  */}
      <video
        className="w-32"
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        autoPlay
        disablePictureInPicture
        disableRemotePlayback
        loop
        muted
        playsInline
      />
    </div>
  )
}

// Audio subtitles / lyrics
// Video volume control
// Video playback speed control
// Video playback position control
