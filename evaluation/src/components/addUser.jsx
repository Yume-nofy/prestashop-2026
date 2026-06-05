import React, { useState } from 'react';
import { addUser } from '../services/testApi';
import './AddUser.css';
import { useNavigate } from 'react-router-dom';
const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    realname: '',
    firstname: '',
    password: '',
    password2: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const navigate = useNavigate();
    try {
      const res = await addUser({
        formdata: formData
      });
      navigate("/");
      console.log("User créé :", res);
    } catch (err) {
      console.error("Erreur création user :", err);
    }
  };

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Créer un utilisateur</h2>

        <input className="input" name="name" placeholder="Nom d'utilisateur"
          onChange={handleChange} value={formData.name} />

        <input className="input" name="realname" placeholder="Nom"
          onChange={handleChange} value={formData.realname} />

        <input className="input" name="firstname" placeholder="Prénom"
          onChange={handleChange} value={formData.firstname} />

        <input className="input" name="password" type="password" placeholder="Mot de passe"
          onChange={handleChange} value={formData.password} />

        <input className="input" name="password2" type="password" placeholder="Confirmer mot de passe"
          onChange={handleChange} value={formData.password2} />

        <button className="btn" type="submit">Créer</button>
      </form>
    </div>
  );
};

export default AddUser;