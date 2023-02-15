import React, { useState } from 'react';
import Axios from 'axios';

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
      await Axios.post<{ message: string }, FormData>('/api/signup', formData);
      alert('Account created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create account');
    }
  };
  // "@nestjs/common
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  return (
    <div>
      <h1>SignUp Page</h1>
      <form className="signup" onSubmit={handleSubmit}>
        <input type="text" name="login" value={formData.login} onChange={handleInputChange} placeholder="Login"/>
        <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password"/>
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
};

export default SignupForm;
