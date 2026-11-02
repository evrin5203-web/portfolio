"use client";

import { useEffect, useRef } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Та же стрелка-курсор, что и на главной: плавно следует за мышью и поворачивается по направлению движения.
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = { x: 0, y: 0, angle: -25, visible: false, action: false };
    const current = { x: 0, y: 0, angle: -25 };
    let previous = { x: 0, y: 0 };
    let frame = 0;

    const animate = () => {
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      const angleDistance = ((target.angle - current.angle + 540) % 360) - 180;
      current.angle += angleDistance * 0.16;
      const element = ref.current;
      if (element) {
        element.style.opacity = target.visible ? "1" : "0";
        element.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) rotate(${current.angle}deg)`;
        element.classList.toggle("is-action", target.action);
      }
      frame = window.requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (Math.hypot(dx, dy) > 3) target.angle = Math.atan2(dy, dx) * 180 / Math.PI + 42;
      previous = { x: event.clientX, y: event.clientY };
      if (!target.visible) { current.x = event.clientX; current.y = event.clientY; }
      target.x = event.clientX;
      target.y = event.clientY;
      target.visible = true;
      target.action = event.target instanceof Element && Boolean(event.target.closest("button, a"));
    };
    const hide = () => { target.visible = false; };

    frame = window.requestAnimationFrame(animate);
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("mouseleave", hide);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", hide);
    };
  }, []);

  return <div ref={ref} className="custom-cursor" aria-hidden="true"><img src={`${basePath}/art/arrow.svg`} alt="" /></div>;
}
