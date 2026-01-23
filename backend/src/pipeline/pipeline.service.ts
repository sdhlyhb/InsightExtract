import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Job, JobType, JobStatus } from "./job.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectQueue("processing")
    private processingQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async startProcessing(documentId: string): Promise<string> {
    // Create a job for extraction and summarization
    const job = this.jobRepository.create({
      documentId,
      type: JobType.EXTRACT,
      status: JobStatus.PENDING,
    });
    await this.jobRepository.save(job);

    // Add to queue
    await this.processingQueue.add("process-document", {
      jobId: job.id,
      documentId,
    });

    return job.id;
  }

  async generateFlashcards(documentId: string): Promise<string> {
    const job = this.jobRepository.create({
      documentId,
      type: JobType.CARDS,
      status: JobStatus.PENDING,
    });
    await this.jobRepository.save(job);

    await this.processingQueue.add("generate-flashcards", {
      jobId: job.id,
      documentId,
    });

    return job.id;
  }

  async updateJobProgress(
    jobId: string,
    progress: number,
    message?: string,
  ): Promise<void> {
    await this.jobRepository.update(jobId, {
      progress,
      message,
      status: JobStatus.RUNNING,
    });

    // Emit event for SSE
    this.eventEmitter.emit("job.progress", {
      jobId,
      progress,
      message,
    });
  }

  async completeJob(jobId: string, result?: any): Promise<void> {
    await this.jobRepository.update(jobId, {
      status: JobStatus.COMPLETED,
      progress: 100,
      completedAt: new Date(),
      result,
    });

    this.eventEmitter.emit("job.completed", { jobId });
  }

  async failJob(jobId: string, error: string): Promise<void> {
    await this.jobRepository.update(jobId, {
      status: JobStatus.FAILED,
      message: error,
    });

    this.eventEmitter.emit("job.failed", { jobId, error });
  }

  async getJob(jobId: string): Promise<Job> {
    return this.jobRepository.findOne({ where: { id: jobId } });
  }
}
