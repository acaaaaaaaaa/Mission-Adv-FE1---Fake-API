import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { movieService, userService } from './services/movieService';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyList from './pages/MyList';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResetPassword from './pages/ResetPass';
import GoogleRegister from './pages/GoogleRegist';

function App() {
  const [allMovies, setAllMovies] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [myMovies, setMyMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await movieService.getAllMovies();
        setAllMovies(movies);
        console.log('Data film berhasil dimuat:', movies.length, 'film');
      } catch (error) {
        console.error("Gagal memuat data film:", error);
        setAllMovies([]);
      }
    };
    
    const loadUserData = async () => {
      try {
        const accountsResult = await userService.getAllUsers();
        if (accountsResult.success) {
          setAccounts(accountsResult.data);
        }
        
        // Untuk sementara tetap gunakan localStorage untuk userId
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setLoggedInUserId(JSON.parse(storedUserId));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setAccounts([]);
        setLoggedInUserId(null);
      }
    };

    fetchMovies();
    loadUserData();
  }, []);

  // useEffect(() => {
  //   
  // }, [accounts]);

  useEffect(() => {
    if (loggedInUserId) {
      const currentUser = accounts.find(acc => acc.id === loggedInUserId);
      if (currentUser) {
        const favoriteMovies = allMovies.filter(movie => currentUser.myMovies.includes(movie.id));
        setMyMovies(favoriteMovies);
      }
    } else {
      setMyMovies([]);
    }
  }, [loggedInUserId, accounts, allMovies]);

  const handleRegister = async (email, password) => {
    try {
      const userExists = accounts.some(acc => acc.email === email);
      if (userExists) {
        alert("Email sudah terdaftar!");
        return false;
      }
    
      const newUser = { email, password, myMovies: [] };
      const result = await userService.createUser(newUser);
      
      if (result.success) {
        setAccounts([...accounts, result.data]);
        return true;
      } else {
        alert("Gagal membuat akun: " + result.error);
        return false;
      }
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Gagal membuat akun");
      return false;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const result = await userService.loginUser(email, password);
      
      if (result.success) {
        const account = result.data;
        localStorage.setItem('userId', JSON.stringify(account.id));
        setLoggedInUserId(account.id);
        return true;
      } else {
        alert(result.error || "Email atau password salah!");
        return false;
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Gagal login");
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setLoggedInUserId(null);
  };
  
  const toggleFavorite = async (movie) => {
    if (!loggedInUserId) return alert("Silakan login dulu.");
    
    try {
      setAccounts(currentAccounts => 
        currentAccounts.map(acc => {
          if (acc.id === loggedInUserId) {
            const isFavorite = acc.myMovies.includes(movie.id);
            const newMyMovies = isFavorite
              ? acc.myMovies.filter(id => id !== movie.id)
              : [...acc.myMovies, movie.id];
            
            userService.updateUserFavorites(acc.id, newMyMovies);
            
            return { ...acc, myMovies: newMyMovies };
          }
          return acc;
        })
      );
    } catch (error) {
      console.error("Error updating favorites:", error);
      alert("Gagal mengupdate daftar favorit");
    }
  };

  return (
    <Router>
      <Navbar user={loggedInUserId} onLogout={handleLogout} />
      <div style={{ paddingTop: '60px', backgroundColor: '#141414', minHeight: 'calc(100vh - 60px)' }}>
        <Routes>
          <Route path="/" element={<Dashboard allMovies={allMovies} myMovies={myMovies} toggleFavorite={toggleFavorite} />} />
          <Route path="/my-list" element={loggedInUserId ? <MyList myMovies={myMovies} toggleFavorite={toggleFavorite} /> : <Navigate to="/login" />} />
          <Route path="/register" element={<Register onRegister={handleRegister} />} />
          <Route path="/login" element={loggedInUserId ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register-google" element={<GoogleRegister />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}
export default App;