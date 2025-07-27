"use client";
/*
 * Documentation:
 * Line Chart — https://app.subframe.com/269cf10fcebb/library?component=Line+Chart_22944dd2-3cdd-42fd-913a-1b11a3c1d16d
 */

import React from "react";
import * as SubframeUtils from "../utils";
import * as SubframeCore from "@subframe/core";

interface LineChartRootProps
  extends React.ComponentProps<typeof SubframeCore.LineChart> {
  className?: string;
}

const LineChartRoot = React.forwardRef<
  React.ElementRef<typeof SubframeCore.LineChart>,
  LineChartRootProps
>(function LineChartRoot(
  { className, ...otherProps }: LineChartRootProps,
  ref
) {
  return (
    <SubframeCore.LineChart
      className={SubframeUtils.twClassNames("h-80 w-full", className)}
      ref={ref}
      colors={[
        "#ec4899",
        "#fbcfe8",
        "#db2777",
        "#f9a8d4",
        "#be185d",
        "#f472b6",
      ]}
      {...otherProps}
    />
  );
});

export const LineChart = LineChartRoot;
