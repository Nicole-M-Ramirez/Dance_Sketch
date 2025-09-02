import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";

function Dancer_Setup() {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!container.current) return;

    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: '/music.json'
    });

    anim.addEventListener('complete', function(e) { console.log('element ended'); });
    anim.addEventListener('DOMLoaded', function(e) { console.log('element loaded'); });

    return () => {
      anim.destroy();
    };
  }, []);

  return (
      <div className="dark-bg h-screen pointer-events-none"
        ref={container}
      />
  );
}

export default Dancer_Setup;