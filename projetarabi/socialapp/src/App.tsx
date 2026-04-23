import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Friends from './pages/Friends'
import Search from './pages/Search'
import Chat from './pages/Chat'
import ProfileView from './pages/ProfileView'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import Nova from './pages/Nova'
import { getToken } from './api'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/nova" element={<Nova />} />
          <Route path="/profile/:userId" element={<ProfileView />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to={getToken() ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
