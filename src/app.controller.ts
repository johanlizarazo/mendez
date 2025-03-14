import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

/* eslint-disable */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    try {
      const knowledgeBase = await extractTextFromDocx(file);
      return { message: knowledgeBase };
    } catch (error) {
      return { error };
    }
  }

  // Endpoint para manejar preguntas usando embeddings
  @Post('chat')
  async chat(@Body() {message, knowledgeBase}, @Res() res) {
    if (!knowledgeBase) return { error: 'Base de conocimiento no cargada' };
      
    try {
      const messages = [
        { role: 'system', content: `Eres un vendedor virtual. Usa la siguiente información para responder: ${knowledgeBase}` },
        { role: 'user', content: message }
      ]
      console.log(messages);
      const response = await ollama.chat({ model: 'llama3.2', messages, stream: true })
      for await (const part of response) {
        console.log(part.message.content);
        res.write(part.message.content || "");
        // return process.stdout.write(part.message.content);
      }
      res.end();
    } catch (error) {
        return { error };
    }
  }
}

export async function extractTextFromDocx(filePath) {
  try {
    return filePath.buffer.toString('utf8');
  } catch (error) {
    console.error('Error al leer el archivo .docx:', error);
    throw new Error('No se pudo extraer el texto del archivo');
  }
}
