import { program } from "./command";
import { parse } from "./parse";

program.addCommand(parse);

program.parse();