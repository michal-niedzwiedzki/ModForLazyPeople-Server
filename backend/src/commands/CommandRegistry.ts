import { Payload } from "../client";
import { Command } from "./Command";

export class CommandRegistry {
  private commands: Array<Command> = [];

  public add(command: Command): CommandRegistry {
    this.commands.push(command);
    return this;
  }

  public retrieve(payload: Payload): Command | undefined {
    for (const command of this.commands) {
      if (command.canHandle(payload)) return command;
    }
  }
}
