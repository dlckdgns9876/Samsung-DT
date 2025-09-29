import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'server', // 웹 프로젝트의 루트를 'server' 폴더로 지정
  publicDir: '../public', // 정적 파일(이미지 등) 폴더 위치 지정
  envDir: '..',   // .env 파일 위치를 상위 폴더로 지정
  server: {
    proxy: {
      '/api': 'http://localhost:4000', // 백엔드 서버 주소
      '/uploads': 'http://localhost:4000', // 업로드 파일 경로 추가
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'server'),
    },
  },
});
