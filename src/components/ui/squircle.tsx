"use client";

import { motion } from "framer-motion";
import { GripHorizontal, RefreshCcw } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

// to use the filter just add this to your layout.tsx
// <SkiperSquiCircleFilterLayout/>
// {children}

// on element you need to add squicircle just add the filter id SkiperSquiCircleFilter
//<div style={{filter: "url(#SquiCircleFilter)"}}></div>

// thats it you can use the filter now no extra rerenders no complications just pure css filter

const DEFAULT_BLUR = 10;
const DEFAULT_COLOR_MATRIX = 20;
const DEFAULT_ALPHA = -7;
const DEFAULT_HEIGHT = 200;
const DEFAULT_WIDTH = 300;
const HEIGHT_MIN = 50;
const HEIGHT_MAX = 500;
const WIDTH_MIN = 100;
const WIDTH_MAX = 600;
const BLUR_MAX = 50;
const COLOR_MATRIX_MIN = 1;
const COLOR_MATRIX_MAX = 50;
const ALPHA_MIN = -20;
const ALPHA_MAX = 0;
const PERCENTAGE = 100;

export const SquiCircleFilterStatic = () => (
  <svg
    aria-hidden="true"
    className="absolute bottom-0 left-0"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Squircle Filter Definition</title>
    <defs>
      <filter id="SkiperSquiCircleFilterLayout">
        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          result="goo"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7"
        />
        <feBlend in="SourceGraphic" in2="goo" />
      </filter>
    </defs>
  </svg>
);

// ------------------------------------------------------------
// use this to toggle the values no need to use this anywhere else
// else bcz it will just add more reRenders and you probably wont need that
// ------------------------------------------------------------

const Skiper63 = () => {
  const [toggle, setToggle] = useState(true);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [blurValue, setBlurValue] = useState(DEFAULT_BLUR);
  const [colorMatrixValue, setColorMatrixValue] =
    useState(DEFAULT_COLOR_MATRIX);
  const [alphaValue, setAlphaValue] = useState(DEFAULT_ALPHA);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="mb-20 grid content-start justify-items-center gap-6 text-center">
        <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:top-full after:left-1/2 after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:to-foreground after:content-['']">
          squicircle with svg filter
        </span>
      </div>
      <SquiCircleFilter
        alphaValue={alphaValue}
        blurValue={blurValue}
        colorMatrixValue={colorMatrixValue}
      />
      <Options
        alphaValue={alphaValue}
        blurValue={blurValue}
        colorMatrixValue={colorMatrixValue}
        height={height}
        setAlphaValue={setAlphaValue}
        setBlurValue={setBlurValue}
        setColorMatrixValue={setColorMatrixValue}
        setHeight={setHeight}
        setToggle={setToggle}
        setWidth={setWidth}
        toggle={toggle}
        width={width}
      />
      <div
        className="rounded-2xl bg-foreground"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          filter: toggle ? "url(#SquiCircleFilter)" : "none",
        }}
      />
    </div>
  );
};

export { Skiper63 };

export const SquiCircleFilter = ({
  blurValue = DEFAULT_BLUR,
  colorMatrixValue = DEFAULT_COLOR_MATRIX,
  alphaValue = DEFAULT_ALPHA,
}: {
  blurValue?: number;
  colorMatrixValue?: number;
  alphaValue?: number;
}) => (
  <svg
    aria-hidden="true"
    className="absolute bottom-0 left-0"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Dynamic Squircle Filter</title>
    <defs>
      <filter id="SquiCircleFilter">
        <feGaussianBlur
          in="SourceGraphic"
          result="blur"
          stdDeviation={blurValue}
        />
        <feColorMatrix
          in="blur"
          mode="matrix"
          result="goo"
          values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${colorMatrixValue} ${alphaValue}`}
        />
        <feBlend in="SourceGraphic" in2="goo" />
      </filter>
    </defs>
  </svg>
);

const Options = ({
  toggle,
  setToggle,
  height,
  setHeight,
  width,
  setWidth,
  blurValue,
  setBlurValue,
  colorMatrixValue,
  setColorMatrixValue,
  alphaValue,
  setAlphaValue,
}: {
  toggle: boolean;
  setToggle: (value: boolean) => void;
  height: number;
  setHeight: (value: number) => void;
  width: number;
  setWidth: (value: number) => void;
  blurValue: number;
  setBlurValue: (value: number) => void;
  colorMatrixValue: number;
  setColorMatrixValue: (value: number) => void;
  alphaValue: number;
  setAlphaValue: (value: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const resetValues = () => {
    setToggle(false);
    setHeight(DEFAULT_HEIGHT);
    setWidth(DEFAULT_WIDTH);
    setBlurValue(DEFAULT_BLUR);
    setColorMatrixValue(DEFAULT_COLOR_MATRIX);
    setAlphaValue(DEFAULT_ALPHA);
  };

  return (
    <motion.div
      className="absolute top-30 right-1/2 flex w-[300px] translate-x-1/2 flex-col gap-3 rounded-3xl border border-foreground/10 bg-muted2 p-3 backdrop-blur-sm lg:right-4 lg:translate-x-0"
      drag={isDragging}
      dragMomentum={false}
    >
      <div className="flex items-center justify-between">
        <span
          className="size-4 cursor-grab active:cursor-grabbing"
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
        >
          <GripHorizontal className="size-4 opacity-50" />
        </span>

        <button
          className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-1 text-sm opacity-50 hover:bg-foreground/10"
          onClick={resetValues}
          type="button"
        >
          Reset
          <span className="group-active:-rotate-360 rotate-0 cursor-pointer transition-all duration-300 group-hover:rotate-90">
            <RefreshCcw className="size-4 opacity-50" />
          </span>
        </button>
      </div>

      <div className="flex w-full flex-col gap-3">
        {/* Toggle Control */}
        <div className="grid grid-cols-3 items-center gap-2 py-1">
          <p className="text-sm opacity-50">Filter :</p>
          <button
            className={cn(
              "flex items-center justify-center rounded-lg bg-muted3 py-1 text-left text-xs opacity-25 transition-colors",
              toggle && "opacity-100"
            )}
            onClick={() => setToggle(true)}
            type="button"
          >
            ON
          </button>
          <button
            className={cn(
              "flex items-center justify-center rounded-lg bg-muted3 py-1 text-left text-xs opacity-25 transition-colors",
              !toggle && "opacity-100"
            )}
            onClick={() => setToggle(false)}
            type="button"
          >
            OFF
          </button>
        </div>

        {/* Height Control */}
        <div className="grid w-full grid-cols-3 items-center py-1">
          <p className="text-sm opacity-50">Height :</p>
          <div className="flex w-full items-center justify-between gap-2">
            <input
              className="h-1.5 w-[150px] cursor-pointer appearance-none overflow-clip rounded-lg bg-muted [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-[length:var(--range-progress)_100%] [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-blue-500 [&::-moz-range-track]:to-[#4F4F4E] [&::-moz-range-track]:bg-no-repeat [&::-webkit-slider-runnable-track]:bg-[length:var(--range-progress)_100%] [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-background [&::-webkit-slider-runnable-track]:bg-no-repeat [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-muted-foreground"
              max={HEIGHT_MAX}
              min={HEIGHT_MIN}
              onChange={(e) => setHeight(Number(e.target.value))}
              style={
                {
                  "--range-progress": `${((height - HEIGHT_MIN) / (HEIGHT_MAX - HEIGHT_MIN)) * PERCENTAGE}%`,
                } as React.CSSProperties
              }
              type="range"
              value={height}
            />
            <span className="w-8 text-right text-xs opacity-50">
              {height}px
            </span>
          </div>
        </div>

        {/* Width Control */}
        <div className="grid w-full grid-cols-3 items-center py-1">
          <p className="text-sm opacity-50">Width :</p>
          <div className="flex items-center justify-between gap-2">
            <input
              className="h-1.5 w-[150px] cursor-pointer appearance-none overflow-clip rounded-lg bg-muted [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-[length:var(--range-progress)_100%] [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-blue-500 [&::-moz-range-track]:to-[#4F4F4E] [&::-moz-range-track]:bg-no-repeat [&::-webkit-slider-runnable-track]:bg-[length:var(--range-progress)_100%] [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-background [&::-webkit-slider-runnable-track]:bg-no-repeat [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-muted-foreground"
              max={WIDTH_MAX}
              min={WIDTH_MIN}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={
                {
                  "--range-progress": `${((width - WIDTH_MIN) / (WIDTH_MAX - WIDTH_MIN)) * PERCENTAGE}%`,
                } as React.CSSProperties
              }
              type="range"
              value={width}
            />
            <span className="w-8 text-right text-xs opacity-50">{width}px</span>
          </div>
        </div>

        {/* Blur Control */}
        <div className="grid w-full grid-cols-3 items-center py-1">
          <p className="text-sm opacity-50">Blur :</p>
          <div className="flex items-center justify-between gap-2">
            <input
              className="h-1.5 w-[150px] cursor-pointer appearance-none overflow-clip rounded-lg bg-muted [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-[length:var(--range-progress)_100%] [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-blue-500 [&::-moz-range-track]:to-[#4F4F4E] [&::-moz-range-track]:bg-no-repeat [&::-webkit-slider-runnable-track]:bg-[length:var(--range-progress)_100%] [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-background [&::-webkit-slider-runnable-track]:bg-no-repeat [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-muted-foreground"
              max={BLUR_MAX}
              min={0}
              onChange={(e) => setBlurValue(Number(e.target.value))}
              style={
                {
                  "--range-progress": `${(blurValue / BLUR_MAX) * PERCENTAGE}%`,
                } as React.CSSProperties
              }
              type="range"
              value={blurValue}
            />
            <span className="w-8 text-right text-xs opacity-50">
              {blurValue}
            </span>
          </div>
        </div>

        {/* Color Matrix Control */}
        <div className="grid w-full grid-cols-3 items-center py-1">
          <p className="text-sm opacity-50">Matrix :</p>
          <div className="flex items-center justify-between gap-2">
            <input
              className="h-1.5 w-[150px] cursor-pointer appearance-none overflow-clip rounded-lg bg-muted [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-[length:var(--range-progress)_100%] [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-blue-500 [&::-moz-range-track]:to-[#4F4F4E] [&::-moz-range-track]:bg-no-repeat [&::-webkit-slider-runnable-track]:bg-[length:var(--range-progress)_100%] [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-background [&::-webkit-slider-runnable-track]:bg-no-repeat [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-muted-foreground"
              max={COLOR_MATRIX_MAX}
              min={COLOR_MATRIX_MIN}
              onChange={(e) => setColorMatrixValue(Number(e.target.value))}
              style={
                {
                  "--range-progress": `${((colorMatrixValue - COLOR_MATRIX_MIN) / (COLOR_MATRIX_MAX - COLOR_MATRIX_MIN)) * PERCENTAGE}%`,
                } as React.CSSProperties
              }
              type="range"
              value={colorMatrixValue}
            />
            <span className="w-8 text-right text-xs opacity-50">
              {colorMatrixValue}
            </span>
          </div>
        </div>

        {/* Alpha Control */}
        <div className="grid w-full grid-cols-3 items-center py-1">
          <p className="text-sm opacity-50">Alpha :</p>
          <div className="flex items-center justify-between gap-2">
            <input
              className="h-1.5 w-[150px] cursor-pointer appearance-none overflow-clip rounded-lg bg-muted [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-[length:var(--range-progress)_100%] [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-blue-500 [&::-moz-range-track]:to-[#4F4F4E] [&::-moz-range-track]:bg-no-repeat [&::-webkit-slider-runnable-track]:bg-[length:var(--range-progress)_100%] [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-background [&::-webkit-slider-runnable-track]:bg-no-repeat [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-muted-foreground"
              max={ALPHA_MAX}
              min={ALPHA_MIN}
              onChange={(e) => setAlphaValue(Number(e.target.value))}
              style={
                {
                  "--range-progress": `${((alphaValue - ALPHA_MIN) / (ALPHA_MAX - ALPHA_MIN)) * PERCENTAGE}%`,
                } as React.CSSProperties
              }
              type="range"
              value={alphaValue}
            />
            <span className="w-8 text-right text-xs opacity-50">
              {alphaValue}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
