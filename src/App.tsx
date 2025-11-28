
import Wizard from './components/Wizard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
            창체활동 시간표 생성기
          </h1>
          <p className="text-lg text-gray-600">
            학교 시간표를 쉽게 생성하고 관리할 수 있습니다.
          </p>
        </div>
        <Wizard />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; (재)한국기원 All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
