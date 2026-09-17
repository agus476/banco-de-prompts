import { Prisma } from "@prisma/client";

export type PromptWithRelations = Prisma.PromptGetPayload<{
  include: {
    category: true;
    tags: { include: { tag: true } };
  };
}>;

export type ProjectWithSubject = Prisma.ProjectGetPayload<{
  include: { subject: true };
}>;

export type SessionWithCounts = Prisma.SessionGetPayload<{
  include: { _count: { select: { interactions: true } } };
}>;

export type InteractionWithLibrary = Prisma.InteractionGetPayload<{
  include: { libraryPrompt: true };
}>;

export type LogbookProject = Prisma.ProjectGetPayload<{
  include: {
    subject: true;
    sessions: {
      include: {
        interactions: true;
      };
    };
  };
}>;
