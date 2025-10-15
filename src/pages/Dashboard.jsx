import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { 
    HelpCircle, 
    Wallet, 
    Plus, 
    BarChart3, 
    TrendingUp, 
    FileText, 
    User,
    LogOut,
    ArrowUpRight,
    ArrowDownRight,
    Trash2 // NOVO: Ícone de lixeira
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useToast } from '../components/ui/use-toast';

// NOVO: Importe os componentes do AlertDialog (Ajuste o caminho se necessário)
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '../components/ui/alert-dialog'; 

const Dashboard = () => {
  // NOVO: Busque deleteTransaction do hook
  const { user, logout } = useAuth();
  const { transactions, getBalance, deleteTransaction } = useTransactions(); 
  const { toast } = useToast();
  const navigate = useNavigate();

  const balance = getBalance();
  // Assume que o ID da transação está incluído no objeto
  const recentTransactions = transactions.slice(-5).reverse();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo! Volte sempre.",
    });
    navigate('/login');
  };

  // NOVO: Função para lidar com a exclusão da transação
  const handleDeleteTransaction = (id, description) => {
    try {
      // Chama a função do hook para remover a transação do estado (e do DB, se implementado)
      const result = deleteTransaction(id); 

      // Aqui, se deleteTransaction for assíncrono, você precisaria de 'await' e este bloco seria 'async'
      if (result && result.success) {
        toast({
          title: "Excluído com sucesso!",
          description: `A transação '${description}' foi removida.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover a transação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTransactionIcon = (type) => {
    if (type === 'receita' || type === 'receita_continua') {
      return <ArrowUpRight className="h-4 w-4 text-green-400" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-red-400" />;
  };

  const getTransactionColor = (type) => {
    if (type === 'receita' || type === 'receita_continua') {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  const transactionCards = [
    {
      title: 'Adicionar Transação',
      description: 'Registre receitas, despesas e débitos automáticos',
      icon: Plus,
      path: '/add-transaction',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Análises',
      description: 'Visualize gastos por categoria em gráficos',
      icon: BarChart3,
      path: '/analytics',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Projeção',
      description: 'Veja como ficará seu saldo no próximo mês',
      icon: TrendingUp,
      path: '/projection',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Relatórios',
      description: 'Gere relatórios completos em PDF',
      icon: FileText,
      path: '/reports',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - MoneyMind</title>
        <meta
          name="description"
          content="Gerencie suas finanças pessoais no dashboard do MoneyMind. Visualize saldo, transações e acesse todas as funcionalidades."
        />
      </Helmet>

      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header (mantido) */}
          {/* ... */}

          {/* Balance Card (mantido) */}
          {/* ... */}

          {/* Transactions Section (Funcionalidades - mantido) */}
          {/* ... */}

          {/* Recent Transactions (BLOCO MODIFICADO) */}
          {recentTransactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Transações Recentes</CardTitle>
                  <CardDescription className="text-gray-300">
                    Suas últimas movimentações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-400">{transaction.category}</p>
                          </div>
                        </div>
                        
                        {/* NOVO BLOCO: Valor, Data e Botão de Excluir */}
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'receita' || transaction.type === 'receita_continua' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          {/* Botão de Exclusão com Modal de Confirmação */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </AlertDialogTrigger>
                            
                            {/* Modal de Confirmação */}
                            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Você tem certeza que deseja excluir a transação de <span className="font-bold">{formatCurrency(transaction.amount)}</span> - **{transaction.description}**?
                                  Esta ação é irreversível e irá atualizar seu **Saldo da Carteira**.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  // Chama a função handleDeleteTransaction, passando ID e Descrição
                                  onClick={() => handleDeleteTransaction(transaction.id, transaction.description)}
                                >
                                  Excluir Transação
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
