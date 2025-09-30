import Layout from './Layout';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "./AuthContext.jsx";

import HomePage from "./HomePage.jsx";
import LoginPage from "./LoginPage.jsx";
import MyPage from "./MyPage.jsx";
import TtsPage from "./TtsPage.jsx";
import GrowthPage from "./growth.jsx";
import KakaoCallback from "./KakaoCallback.jsx";
import RegisterPage from "./RegisterPage.jsx";
import CommunityPage from "./CommunityPage.jsx";


ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="tts" element={<TtsPage />} />
          <Route path="growth" element={<GrowthPage />} />
          <Route path="/kakao/callback" element={<KakaoCallback />} />
          <Route path="/community" element={<CommunityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
  // <React.StrictMode>
  //   <AuthProvider>
  //     <BrowserRouter>
  //       <Routes>
  //         <Route path="/" element={<Layout />}>
  //           <Route index element={<HomePage />} />
  //           <Route path="login" element={<LoginPage />} />
  //           <Route path="register" element={<RegisterPage />} />
  //           <Route path="mypage" element={<MyPage />} />
  //           <Route path="tts" element={<TtsPage />} />
  //           <Route path="growth" element={<GrowthPage />} />
  //           <Route path="/kakao/callback" element={<KakaoCallback />} />
  //         </Route>
  //       </Routes>
  //     </BrowserRouter>
  //   </AuthProvider>
  // </React.StrictMode>
);
