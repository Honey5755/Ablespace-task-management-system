import { Controller, Get } from '@nestjs/common';

/**
 * Unauthenticated liveness probe for the deploy host.
 *
 * Deliberately does not touch the database. The host restarts the container
 * when this fails, and a restart cannot fix a database outage — it would only
 * take the API down alongside it. This answers "is the process serving HTTP",
 * which is the only question a restart can actually act on.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }
}
