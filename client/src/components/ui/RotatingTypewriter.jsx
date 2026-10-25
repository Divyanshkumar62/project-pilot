import React, { useState, useEffect } from "react";

const RotatingTypewriter = ({
  words = [],
  typingSpeed = 75,
  deletingSpeed = 35,
  pauseDuration = 2000,
  className = "",
  cursorClassName = "",
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;

    const targetWord = words[currentWordIndex];
    let timeout;

    if (!isDeleting && currentText === targetWord) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && currentText === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, 400);
    } else if (isDeleting) {
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      timeout = setTimeout(() => {
        setCurrentText((prev) => targetWord.slice(0, prev.length + 1));
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      <span>{currentText}</span>
      <span
        aria-hidden="true"
        className={`inline-block ml-1.5 w-[3px] h-[0.9em] align-baseline bg-blue-600 animate-pulse rounded-sm ${cursorClassName}`}
      />
    </span>
  );
};

export default RotatingTypewriter;
