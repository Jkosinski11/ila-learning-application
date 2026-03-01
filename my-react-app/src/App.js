import "./App.css";
import TeacherInvitePanel from "./components/teacherInvitePanel";
import JoinClassPanel from "./components/JoinClassPanel";

function App() {
  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
      <h1>iLa (Mock Mode)</h1>

      <TeacherInvitePanel />

      <JoinClassPanel />
    </div>
  );
}

export default App;
