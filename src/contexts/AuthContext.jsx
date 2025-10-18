import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// --------------------------------------------------------
// NOVO: Funções de Hashing de Senha (SHA-256)
// --------------------------------------------------------

/**
 * Gera um hash SHA-256 da senha usando a API nativa do navegador (SubtleCrypto).
 * @param {string} password - A senha em texto puro.
 * @returns {Promise<string>} O hash da senha em formato hexadecimal.
 */
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  // Gera o hash (resumo criptográfico)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); 
  // Converte o ArrayBuffer do hash para uma string hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Compara uma senha em texto puro com um hash armazenado.
 * @param {string} password - A senha digitada pelo usuário.
 * @param {string} storedHash - O hash da senha armazenado (do localStorage).
 * @returns {Promise<boolean>} Retorna true se as senhas coincidirem (após hashing).
 */
const comparePassword = async (password, storedHash) => {
    const newHash = await hashPassword(password);
    return newHash === storedHash;
};

// --------------------------------------------------------
// HOOKS E CONTEXTO
// --------------------------------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('moneymind_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // --------------------------------------------------------
  // FUNÇÕES DE AUTENTICAÇÃO (AGORA ASSÍNCRONAS)
  // --------------------------------------------------------

  /**
   * Realiza o login, comparando o hash da senha digitada com o hash armazenado.
   */
  const login = async (email, password) => { // Tornada ASYNC
    const users = JSON.parse(localStorage.getItem('moneymind_users') || '[]');
    // Busca o usuário apenas pelo email
    const user = users.find(u => u.email === email);
    
    // Verifica se o usuário existe E se o hash da senha digitada bate com o hash salvo
    if (user && await comparePassword(password, user.password)) { 
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      localStorage.setItem('moneymind_user', JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    
    return { success: false, error: 'Email ou senha incorretos' };
  };

  /**
   * Registra um novo usuário, salvando o HASH da senha em vez da senha em texto puro.
   */
  const register = async (userData) => { // Tornada ASYNC
    const users = JSON.parse(localStorage.getItem('moneymind_users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    // PASSO DE SEGURANÇA: Hashing da senha antes de salvar
    const hashedPassword = await hashPassword(userData.password);

    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword, // SALVA O HASH CRIPTOGRAFADO AQUI!
      createdAt: new Date().toISOString(),
      balance: 0
    };

    users.push(newUser);
    localStorage.setItem('moneymind_users', JSON.stringify(users));

    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    setUser(userWithoutPassword);
    localStorage.setItem('moneymind_user', JSON.stringify(userWithoutPassword));

    return { success: true };
  };

  // --------------------------------------------------------
  // FUNÇÕES AUXILIARES (PERMANECEM AS MESMAS)
  // --------------------------------------------------------

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moneymind_user');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('moneymind_user', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('moneymind_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      // Nota: o update aqui NÃO deve alterar a senha, a menos que haja um campo específico para isso.
      users[userIndex] = { ...users[userIndex], ...userData }; 
      localStorage.setItem('moneymind_users', JSON.stringify(users));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
