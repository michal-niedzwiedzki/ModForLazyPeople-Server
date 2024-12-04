// TODO: add type for cmd

export interface Payload {
  clientKey: string
  minecraftId: string
  type: "STATUS" | "PARTY"
  body: {
    cmd: string
    user?: string
  }
}