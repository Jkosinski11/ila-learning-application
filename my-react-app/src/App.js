import { AuthProvider } from "./AuthContext";
import Auth from "./Auth";

function App() {
  return (
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );
}

export default App;