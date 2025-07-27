"use client";
/*
 * Documentation:
 * Image Gallery — https://app.subframe.com/library?component=Image+Gallery_c4c6c2b7-38c8-4e9b-a517-9eb6bdb7c920
 */

import React from "react";
import * as SubframeUtils from "../utils";

interface PreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  rightArrow?: React.ReactNode;
  leftArrow?: React.ReactNode;
  className?: string;
}

const Preview = React.forwardRef<HTMLDivElement, PreviewProps>(function Preview(
  { image, rightArrow, leftArrow, className, ...otherProps }: PreviewProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "group/8b322fea flex items-center gap-4 overflow-hidden rounded-md relative cursor-default",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {leftArrow ? (
        <div className="hidden items-center gap-4 absolute left-2 group-hover/8b322fea:flex">
          {leftArrow}
        </div>
      ) : null}
      {image ? (
        <img
          className="grow shrink-0 basis-0 self-stretch object-cover"
          src={image}
        />
      ) : null}
      {rightArrow ? (
        <div className="hidden items-center gap-4 absolute right-2 group-hover/8b322fea:flex">
          {rightArrow}
        </div>
      ) : null}
    </div>
  );
});

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  selected?: boolean;
  className?: string;
}

const Tile = React.forwardRef<HTMLDivElement, TileProps>(function Tile(
  { image, selected = false, className, ...otherProps }: TileProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "group/1823a3f3 flex cursor-pointer flex-col items-start gap-2 overflow-hidden rounded-md border-2 border-solid border-transparent flex-none",
        { "border-2 border-solid border-brand-600": selected },
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {image ? (
        <img className="h-32 flex-none object-cover" src={image} />
      ) : null}
    </div>
  );
});

interface ImageGalleryRootProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const ImageGalleryRoot = React.forwardRef<
  HTMLDivElement,
  ImageGalleryRootProps
>(function ImageGalleryRoot(
  { className, ...otherProps }: ImageGalleryRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex flex-col items-start gap-2",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <Preview
        className="h-112 w-full flex-none"
        image="https://res.cloudinary.com/subframe/image/upload/v1711417570/shared/hwiwt695ljjvbsi83osu.jpg"
      />
      <div className="flex w-full items-start gap-2 overflow-auto -ml-0.5">
        <Tile image="https://res.cloudinary.com/subframe/image/upload/v1711417572/shared/wpt49pnc6srm1zxiyubg.jpg" />
        <Tile
          image="https://res.cloudinary.com/subframe/image/upload/v1711417570/shared/hwiwt695ljjvbsi83osu.jpg"
          selected={true}
        />
        <Tile image="https://res.cloudinary.com/subframe/image/upload/v1711417574/shared/zovip13na5pbftpfxwcy.jpg" />
        <Tile image="https://res.cloudinary.com/subframe/image/upload/v1711417576/shared/bsa3eonjzvhxusz9aqgr.png" />
      </div>
    </div>
  );
});

export const ImageGallery = Object.assign(ImageGalleryRoot, {
  Preview,
  Tile,
});
