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
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data); 
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
    if (!password || !storedHash) return false;
    const newHash = await hashPassword(password);
    return newHash === storedHash;
};

/**
 * Auxiliar para verificar se a senha salva já está em formato hash (SHA-256).
 * Um hash SHA-256 tem 64 caracteres hexadecimais.
 */
const isPasswordHashed = (password) => {
    return typeof password === 'string' && password.length === 64 && /^[0-9a-fA-F]+$/.test(password);
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
  // FUNÇÕES DE AUTENTICAÇÃO (AGORA ASSÍNCRONAS COM MIGRAÇÃO)
  // --------------------------------------------------------

  /**
   * Realiza o login, com lógica de fallback e migração para senhas antigas.
   */
  const login = async (email, password) => { // Tornada ASYNC
    const users = JSON.parse(localStorage.getItem('moneymind_users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
        return { success: false, error: 'Email ou senha incorretos' };
    }

    let isAuthenticated = false;
    let needsMigration = false;

    // PASSO 1: Tenta logar usando o HASH seguro (o novo método)
    if (isPasswordHashed(user.password)) {
        isAuthenticated = await comparePassword(password, user.password);
    } 
    
    // PASSO 2: FALLBACK - Tenta logar usando a senha em TEXTO PURO (método antigo)
    // Isso só será tentado se o login falhou OU se a senha salva é texto puro
    if (!isAuthenticated && !isPasswordHashed(user.password)) {
        if (user.password === password) {
            isAuthenticated = true; // Login bem-sucedido com texto puro!
            needsMigration = true;  // Marcamos para migração
        }
    }
    
    if (isAuthenticated) {
        // PASSO 3: MIGRAÇÃO - Se o login foi feito com texto puro, nós atualizamos
        if (needsMigration) {
            console.warn(`[Segurança] Migrando senha do usuário ${user.id} para Hashing.`);
            const hashedPassword = await hashPassword(password);
            
            // Atualiza a senha na array de users do localStorage para o novo HASH
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].password = hashedPassword;
                localStorage.setItem('moneymind_users', JSON.stringify(users));
            }
            // Atualiza o objeto do usuário localmente
            user.password = hashedPassword;
        }

        // Finaliza o Login
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        setUser(userWithoutPassword);
        localStorage.setItem('moneymind_user', JSON.stringify(userWithoutPassword));
        return { success: true };
    }
    
    // Falha final
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
  // FUNÇÕES AUXILIARES
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
