import Wizard from './components/Wizard';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-[100dvh] py-8 sm:py-12">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-keep [text-wrap:balance] mb-2">
            창체활동 시간표 생성기
          </h1>
          <p className="text-base sm:text-lg text-slate-600 break-keep">
            학교 시간표를 쉽게 생성하고 관리할 수 있습니다.
          </p>
        </header>

        <main>
          <Wizard />
        </main>

        <footer className="mt-12 sm:mt-16 text-center text-slate-500 text-sm">
          <p>&copy; (재)한국기원 All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
