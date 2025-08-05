"use client";
/*
 * Documentation:
 * MatCard — https://app.subframe.com/269cf10fcebb/library?component=MatCard_2c95c7b8-327d-469b-acb0-dabc327c3db6
 * Button — https://app.subframe.com/269cf10fcebb/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 * Select — https://app.subframe.com/269cf10fcebb/library?component=Select_bb88f90b-8c43-4b73-9c2f-3558ce7838f3
 * Toggle Group — https://app.subframe.com/269cf10fcebb/library?component=Toggle+Group_2026f10a-e3cc-4c89-80da-a7259acae3b7
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { Button } from "./Button";
import { FeatherPen } from "@subframe/core";
import { FeatherRefreshCw } from "@subframe/core";
import { FeatherTrash2 } from "@subframe/core";
import { Select } from "./Select";
import { FeatherSearch } from "@subframe/core";
import { ToggleGroup } from "./ToggleGroup";

interface MatCardRootProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  text?: React.ReactNode;
  text2?: React.ReactNode;
  text3?: React.ReactNode;
  text4?: React.ReactNode;
  text5?: React.ReactNode;
  text6?: React.ReactNode;
  produktbild?: React.ReactNode;
  maE?: React.ReactNode;
  className?: string;
}

const MatCardRoot = React.forwardRef<HTMLDivElement, MatCardRootProps>(
  function MatCardRoot(
    {
      image,
      text,
      text2,
      text3,
      text4,
      text5,
      text6,
      produktbild,
      maE,
      className,
      ...otherProps
    }: MatCardRootProps,
    ref
  ) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          "flex w-full flex-col items-start gap-2",
          className
        )}
        ref={ref}
        {...otherProps}
      >
        <div className="flex h-40 w-full flex-none items-center gap-2 rounded-lg bg-default-background shadow-lg">
          {produktbild ? (
            <div className="flex h-40 w-40 flex-none flex-col items-start justify-center gap-6">
              {produktbild}
            </div>
          ) : null}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch border-r border-solid border-neutral-border pl-2 pr-4 py-2">
            <div className="flex w-full flex-col items-start gap-2">
              {text ? (
                <span className="line-clamp-1 w-full text-heading-2 font-heading-2 text-default-font">
                  {text}
                </span>
              ) : null}
            </div>
            <div className="flex w-full items-center gap-2">
              {text2 ? (
                <span className="text-body font-body text-default-font">
                  {text2}
                </span>
              ) : null}
              {text3 ? (
                <span className="line-clamp-1 grow shrink-0 basis-0 text-caption font-caption text-default-font">
                  {text3}
                </span>
              ) : null}
            </div>
            {maE ? (
              <span className="w-full whitespace-pre-wrap text-caption font-caption text-subtext-color">
                {maE}
              </span>
            ) : null}
            <div className="flex w-full grow shrink-0 basis-0 items-center gap-12">
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch">
                {text4 ? (
                  <span className="line-clamp-3 w-full grow shrink-0 basis-0 text-caption font-caption text-subtext-color">
                    {text4}
                  </span>
                ) : null}
                {text6 ? (
                  <span className="line-clamp-1 w-full text-caption font-caption text-subtext-color">
                    {text6}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex w-36 flex-none flex-col items-center justify-center gap-2 self-stretch px-2 py-2">
            <div className="flex items-start justify-center gap-2 px-2 py-2">
              <Button
                className="h-12 w-auto flex-none"
                variant="brand-secondary"
              >
                1.559,23 €
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <FeatherPen className="text-heading-2 font-heading-2 text-brand-700" />
              <FeatherRefreshCw className="text-heading-2 font-heading-2 text-brand-700" />
              <FeatherTrash2 className="text-heading-2 font-heading-2 text-brand-700" />
            </div>
          </div>
          <div className="flex w-72 flex-none flex-col items-end justify-center gap-1 self-stretch border-l border-solid border-neutral-border px-4 py-4">
            <div className="flex w-full items-center gap-2">
              <Select
                className="h-auto grow shrink-0 basis-0"
                variant="filled"
                label=""
                placeholder="Katgorieauswahl"
                helpText=""
                icon={<FeatherSearch />}
              >
                <Select.Item value="option1">option1</Select.Item>
                <Select.Item value="option2">option2</Select.Item>
                <Select.Item value="option3">option3</Select.Item>
                <Select.Item value="option4">option4</Select.Item>
                <Select.Item value="option5">option5</Select.Item>
              </Select>
            </div>
            <Select
              className="h-auto w-full flex-none"
              variant="filled"
              label=""
              placeholder="Projektauswahl"
              helpText=""
              icon={<FeatherSearch />}
            >
              <Select.Item value="option1">option1</Select.Item>
              <Select.Item value="option2">option2</Select.Item>
              <Select.Item value="option3">option3</Select.Item>
              <Select.Item value="option4">option4</Select.Item>
              <Select.Item value="option5">option5</Select.Item>
            </Select>
            <ToggleGroup className="h-auto w-full flex-none">
              <ToggleGroup.Item value="48de3386">1</ToggleGroup.Item>
              <ToggleGroup.Item value="4ea19945">2</ToggleGroup.Item>
              <ToggleGroup.Item value="bb62984b">3</ToggleGroup.Item>
              <ToggleGroup.Item value="9c941c9a">4</ToggleGroup.Item>
              <ToggleGroup.Item value="8eecbe7c">5</ToggleGroup.Item>
            </ToggleGroup>
          </div>
        </div>
      </div>
    );
  }
);

export const MatCard = MatCardRoot;
