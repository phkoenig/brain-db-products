"use client";
/*
 * Documentation:
 * Table101 — https://app.subframe.com/269cf10fcebb/library?component=Table101_30743aba-822e-49f0-866f-95f5037377b4
 * Table — https://app.subframe.com/269cf10fcebb/library?component=Table_142dfde7-d0cc-48a1-a04c-a08ab2252633
 * Dropdown Menu — https://app.subframe.com/269cf10fcebb/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Button — https://app.subframe.com/269cf10fcebb/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 * Badge — https://app.subframe.com/269cf10fcebb/library?component=Badge_97bdb082-1124-4dd7-a335-b14b822d0157
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { Table } from "./Table";
import { FeatherPencil } from "@subframe/core";
import { FeatherCopy } from "@subframe/core";
import { FeatherTrash2 } from "@subframe/core";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherPlus } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherTrash } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Button } from "./Button";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherSend } from "@subframe/core";
import { Badge } from "./Badge";

interface Table101RootProps extends React.HTMLAttributes<HTMLDivElement> {
  email?: React.ReactNode;
  className?: string;
}

const Table101Root = React.forwardRef<HTMLDivElement, Table101RootProps>(
  function Table101Root(
    { email, className, ...otherProps }: Table101RootProps,
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
        <Table
          header={
            <Table.HeaderRow>
              <Table.HeaderCell>Bearbeiten</Table.HeaderCell>
              <Table.HeaderCell>Symbol</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Beschreibung</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Url</Table.HeaderCell>
              <Table.HeaderCell>Preis</Table.HeaderCell>
              <Table.HeaderCell>Dropdown</Table.HeaderCell>
              <Table.HeaderCell />
              <Table.HeaderCell>Kategorie 1</Table.HeaderCell>
              <Table.HeaderCell>Kategorie 2</Table.HeaderCell>
            </Table.HeaderRow>
          }
        >
          <Table.Row>
            <Table.Cell>
              <div className="flex items-start gap-2">
                <FeatherPencil className="text-heading-3 font-heading-3 text-default-font" />
                <FeatherCopy className="text-heading-3 font-heading-3 text-default-font" />
                <FeatherTrash2 className="text-heading-3 font-heading-3 text-default-font" />
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="flex h-8 items-center gap-1">
                <img
                  className="flex-none self-stretch object-cover"
                  src="https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png"
                />
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                John Walton
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-neutral-500">Text</span>
            </Table.Cell>
            <Table.Cell>
              {email ? (
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  {email}
                </span>
              ) : null}
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                example@site.com
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="whitespace-nowrap text-body font-body text-neutral-500">
                € 1.500,00
              </span>
            </Table.Cell>
            <Table.Cell>
              <SubframeCore.DropdownMenu.Root>
                <SubframeCore.DropdownMenu.Trigger asChild={true}>
                  <Button
                    variant="neutral-secondary"
                    iconRight={<FeatherChevronDown />}
                  >
                    Dropdown
                  </Button>
                </SubframeCore.DropdownMenu.Trigger>
                <SubframeCore.DropdownMenu.Portal>
                  <SubframeCore.DropdownMenu.Content
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    asChild={true}
                  >
                    <DropdownMenu>
                      <DropdownMenu.DropdownItem>
                        Favorite
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherPlus />}>
                        Add
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                        Edit
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                        Delete
                      </DropdownMenu.DropdownItem>
                    </DropdownMenu>
                  </SubframeCore.DropdownMenu.Content>
                </SubframeCore.DropdownMenu.Portal>
              </SubframeCore.DropdownMenu.Root>
            </Table.Cell>
            <Table.Cell>
              <Button icon={<FeatherSend />}>Send</Button>
            </Table.Cell>
            <Table.Cell>
              <Badge>Kategorie A</Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="error">Kategorie B</Badge>
            </Table.Cell>
          </Table.Row>
        </Table>
      </div>
    );
  }
);

export const Table101 = Table101Root;
