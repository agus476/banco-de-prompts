/** Text exchanged in one user/assistant interaction, independent of its source. */
export type ChatTurn = {
  order: number;
  prompt: string;
  response: string;
};
