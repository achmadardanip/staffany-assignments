import { Server } from "@hapi/hapi";
import { weekStartParamDto } from "../../../shared/dtos";
import * as weekController from "./weekController";

export default function (server: Server, basePath: string) {
  server.route({
    method: "GET",
    path: `${basePath}/{weekStartDate}`,
    handler: weekController.findByStartDate,
    options: {
      description: "Get week information",
      notes: "Get publishing metadata for a week",
      tags: ["api", "week"],
      validate: {
        params: weekStartParamDto,
      },
    },
  });

  server.route({
    method: "POST",
    path: `${basePath}/{weekStartDate}/publish`,
    handler: weekController.publish,
    options: {
      description: "Publish week",
      notes: "Publish all shifts within a week",
      tags: ["api", "week"],
      validate: {
        params: weekStartParamDto,
      },
    },
  });
}
