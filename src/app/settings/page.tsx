"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { FeatherStar } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherTrash } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherMoreHorizontal } from "@subframe/core";

function Settings() {
  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
        <div className="flex flex-col items-start gap-4">
          <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
            {"Kategorien\n"}
          </span>
          <Table
            className="h-auto w-auto flex-none"
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Main</Table.HeaderCell>
                <Table.HeaderCell>Sub</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  FB.FL
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Fußbodenbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Fliesen
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  FB.TP
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Fußbodenbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Teppiche
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  FB.GU
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Fußbodenbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Gussböden
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  WB.FL
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Wandbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Fliesen
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  WB.PU
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Wandbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Putzsysteme
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  WB.PA
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Wandbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Paneele &amp; Verkleidungen
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-pre-wrap text-body font-body text-neutral-500">
                  {"WB.TA\n"}
                </span>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="neutral">Wandbeläge</Badge>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  Tapeten
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="medium"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
                      />
                    </SubframeCore.DropdownMenu.Trigger>
                    <SubframeCore.DropdownMenu.Portal>
                      <SubframeCore.DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={8}
                        asChild={true}
                      >
                        <DropdownMenu>
                          <DropdownMenu.DropdownItem icon={<FeatherStar />}>
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
                </div>
              </Table.Cell>
            </Table.Row>
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default Settings; 