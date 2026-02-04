import "dotenv/config";
import { createSocketServer } from "./src/lib/socket-server";

console.log("Starting SMS Gateway Socket Server...");
createSocketServer();
