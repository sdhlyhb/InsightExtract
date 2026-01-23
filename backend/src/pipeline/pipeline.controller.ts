import { Controller, Get, Param, Sse } from "@nestjs/common";
import { PipelineService } from "./pipeline.service";
import { Observable, fromEvent, map } from "rxjs";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Controller("jobs")
export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get(":id")
  async getJob(@Param("id") id: string) {
    return this.pipelineService.getJob(id);
  }

  @Sse(":id/stream")
  streamJobProgress(@Param("id") jobId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, "job.progress").pipe(
      map((data: any) => {
        if (data.jobId === jobId) {
          return {
            data: JSON.stringify(data),
          } as MessageEvent;
        }
        return null;
      }),
    );
  }
}
