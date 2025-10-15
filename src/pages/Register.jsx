import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff, DollarSign, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
  });

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Atualiza validações de senha em tempo real
  useEffect(() => {
    const { password } = formData;
    setPasswordValidations({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      specialChar: /[\W_]/.test(password)
    });
  }, [formData.password]);

  const validatePassword = (password) => {
    return Object.values(passwordValidations).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 6 caracteres, uma letra maiúscula, uma letra minúscula e um caractere especial.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao MoneyMind.",
      });
      navigate('/dashboard');
    } else {
      const errorMessage = result.error.includes('email') 
        ? "Esse email já está sendo utilizado em outra conta"
        : result.error;

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Cadastro - MoneyMind</title>
        <meta name="description" content="Crie sua conta no MoneyMind e comece a gerenciar suas finanças pessoais de forma inteligente." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block space-y-8"
          >
            {/* Conteúdo do lado esquerdo igual ao original */}
          </motion.div>

          {/* Right Side - Register Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="glass-effect border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 text-center">
                <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold gradient-text">MoneyMind</h1>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <UserPlus className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-2xl font-bold text-white">Criar conta</CardTitle>
                </div>
                <CardDescription className="text-gray-300">
                  Preencha os dados para começar
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome completo</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Regras de senha em tempo real */}
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-400">A senha deve conter:</p>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center space-x-2">
                          {passwordValidations.length ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                          <span>6 caracteres ou mais</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {passwordValidations.uppercase ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                          <span>Uma letra maiúscula</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {passwordValidations.lowercase ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                          <span>Uma letra minúscula</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {passwordValidations.specialChar ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                          <span>Um caractere especial</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Já tem uma conta?{' '}
                    <Link
                      to="/login"
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Faça login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Register;
