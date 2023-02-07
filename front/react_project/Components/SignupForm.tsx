import React, { useState } from 'react';
import axios from 'axios';

interface FormData {
  login: string;
  password: string;
}

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: ''
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await axios.post<{ message: string }, FormData>('/api/signup', formData);
      alert('Account created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create account');
    }
  };
  "@nestjs/common
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="login" value={formData.login} onChange={handleInputChange} />
      <input type="password" name="password" value={formData.password} onChange={handleInputChange} />
      <button type="submit">Sign up</button>
    </form>
  );
};

export default SignupForm;
