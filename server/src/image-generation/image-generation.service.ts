import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class ImageGenerationService {
  private readonly imageBaseUrl = process.env.IMAGE_GENERATION_BASE_URL || 'https://image.pollinations.ai/prompt';

  async generate(prompt: string) {
    const cleanPrompt = prompt?.trim();
    if (!cleanPrompt) {
      throw new InternalServerErrorException('Image prompt is empty.');
    }

    const imageUrl = this.buildImageUrl(cleanPrompt);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(imageUrl, {
        headers: {
          Accept: 'image/*',
          'User-Agent': 'BizPlanMobile/1.0',
        },
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || 'image/jpeg';

      if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
        const message = await response.text().catch(() => 'Image provider did not return an image.');
        throw new ServiceUnavailableException(
          `Free image provider failed with ${response.status}: ${message.slice(0, 220)}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) {
        throw new ServiceUnavailableException('Free image provider returned an empty image.');
      }

      return {
        base64: buffer.toString('base64'),
        mimeType: contentType.split(';')[0] || 'image/jpeg',
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown image generation error.';
      throw new ServiceUnavailableException(`Free image generation failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildImageUrl(prompt: string) {
    const polishedPrompt = [
      prompt.replace(/\s+/g, ' ').trim().slice(0, 1200),
      'high quality commercial social media image',
      'photorealistic, sharp focus, natural lighting, premium composition',
      'no watermark, no UI, no large text overlay, no distorted faces',
    ].join(', ');

    const params = new URLSearchParams({
      width: '1024',
      height: '1024',
      model: 'flux',
      nologo: 'true',
      private: 'true',
      safe: 'true',
      seed: String(Date.now() % 1_000_000_000),
    });

    return `${this.imageBaseUrl}/${encodeURIComponent(polishedPrompt)}?${params.toString()}`;
  }
}
