import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LockReset, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';

// Replicar as funções de validação de senha para este componente
const checkPasswordStrength = (password) => {
    // ... (Copie a função checkPasswordStrength do Register.jsx aqui)
    const validations = { /* ... */ }; // Coloque a lógica de validação aqui
    const results = {};
    let isValid = true;
    for (const key in validations) {
        const passed = validations[key].regex.test(password);
        results[key] = passed;
        if (!passed) { isValid = false; }
    }
    return { isValid, details: results, validations };
};

// Replicar o componente de lista de validação
const ValidationList = ({ details, validations }) => (
    // ... (Copie o componente ValidationList do Register.jsx aqui)
    <ul className="text-sm space-y-1 mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
        {/* ... Lógica de renderização ... */}
    </ul>
);

const ForgotPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordValidations, setPasswordValidations] = useState(checkPasswordStrength(''));

    const { resetPassword } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));

        if (name === 'newPassword') {
            setPasswordValidations(checkPasswordStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Erro na Redefinição",
                description: "As novas senhas não coincidem.",
                variant: "destructive",
            });
            return;
        }

        if (!passwordValidations.isValid) {
            toast({
                title: "Senha fraca",
                description: "A nova senha não atende aos requisitos de segurança.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(formData.email, formData.newPassword);

            if (result.success) {
                toast({
                    title: "Sucesso!",
                    description: "Sua senha foi redefinida. Faça login.",
                });
                navigate('/login');
            } else {
                toast({
                    title: "Erro na Redefinição",
                    description: result.error || "Falha ao redefinir a senha.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Erro interno",
                description: "Ocorreu um erro inesperado.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="glass-effect border-white/20 shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <LockReset className="h-6 w-6 text-yellow-400" />
                            <CardTitle className="text-2xl font-bold text-white">Recuperar Senha</CardTitle>
                        </div>
                        <CardDescription className="text-gray-300">
                            Digite seu email e a nova senha.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Digite a nova senha"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <ValidationList 
                                    details={passwordValidations.details} 
                                    validations={passwordValidations.validations} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-white">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirme a nova senha"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                                disabled={loading || !passwordValidations.isValid}
                            >
                                {loading ? "Redefinindo..." : "Redefinir Senha"}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <Link
                                to="/login"
                                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors text-sm"
                            >
                                Lembrei da senha. Voltar para o Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
