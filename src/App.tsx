import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from './lib/supabase';
import './App.css';

// Clean App.tsx

const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 6.5L12 13L21 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

function LoginPage() {
  const navigate = useNavigate();

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") || "") as string;
    const password = (formData.get("password") || "") as string;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: groupData } = await supabase.from("groups").select("id").eq("user_id", user.id).single();
    if (groupData) navigate("/visualizacao"); else navigate("/cadastro");
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <div className="brand-badge">CS</div>
          <div>
            <h1>COMESOL</h1>
            <p className="subtitle">Cadastro e gestão de grupos</p>
          </div>
        </div>
      </header>

      <main className="center-card">
        <div className="card">
          <h2 className="card-title">Entrar</h2>
          <form onSubmit={handleEmailLogin} className="form">
            <label className="input-group">
              <span className="icon"><IconEmail /></span>
              <input name="email" placeholder="E-mail" className="input" required />
            </label>

            <label className="input-group">
              <span className="icon"><IconLock /></span>
              <input type="password" name="password" placeholder="Senha" className="input" required />
            </label>

            <button type="submit" className="btn-primary">Entrar</button>
          </form>
        </div>
      </main>
    </div>
  );
}

function CadastroPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [group, setGroup] = useState<any>({});
  const [newMember, setNewMember] = useState<any>({});
  const navigate = useNavigate();

  function handleAddMember() {
    setMembers([...members, newMember]);
    setNewMember({});
  }

  async function handleSaveGroup() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert([
        {
          user_id: user.id,
          nome_grupo: group.nome_grupo,
          nome_representante: group.nome_representante,
          email_contato: group.email_contato,
          possui_sede: group.possui_sede,
          endereco: group.endereco,
        } as any,
      ])
      .select()
      .single();

    if (groupError || !groupData) return;
    const formattedMembers = members.map((m) => ({ ...m, group_id: groupData.id }));
    await supabase.from("members").insert(formattedMembers as any);
    navigate("/visualizacao");
  }

  return (
    <div className="app-container">
      <header className="app-header small">
        <div className="brand">
          <div className="brand-badge">CS</div>
          <div>
            <h1>COMESOL</h1>
            <p className="subtitle">Cadastro e gestão de grupos</p>
          </div>
        </div>
      </header>

      <main className="center-card">
        <div className="card large">
          <h2 className="card-title">Cadastro do Grupo</h2>

          <section className="section">
            <div className="section-grid">
              <label className="input-group">
                <span className="icon"><IconUser /></span>
                <input placeholder="Nome do Grupo" className="input" onChange={(e) => setGroup({ ...group, nome_grupo: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon"><IconUser /></span>
                <input placeholder="Nome do Representante" className="input" onChange={(e) => setGroup({ ...group, nome_representante: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon"><IconEmail /></span>
                <input placeholder="E-mail de Contato" className="input" onChange={(e) => setGroup({ ...group, email_contato: e.target.value })} />
              </label>

              <label className="checkbox-inline">
                <input type="checkbox" onChange={(e) => setGroup({ ...group, possui_sede: e.target.checked })} /> Possui sede própria?
              </label>

              {group.possui_sede && (
                <label className="input-group col-span-2">
                  <span className="icon">📍</span>
                  <input placeholder="Endereço Completo" className="input" onChange={(e) => setGroup({ ...group, endereco: e.target.value })} />
                </label>
              )}
            </div>
          </section>

          <h3 className="card-subtitle">Adicionar Membro</h3>
          <section className="section">
            <div className="section-grid">
              <label className="input-group">
                <span className="icon"><IconUser /></span>
                <input placeholder="Nome Completo" className="input" onChange={(e) => setNewMember({ ...newMember, nome_completo: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">📅</span>
                <input type="date" className="input" onChange={(e) => setNewMember({ ...newMember, data_nascimento: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">👩‍👧</span>
                <input placeholder="Nome da Mãe" className="input" onChange={(e) => setNewMember({ ...newMember, nome_mae: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">📍</span>
                <input placeholder="Endereço" className="input" onChange={(e) => setNewMember({ ...newMember, endereco: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">🔢</span>
                <input placeholder="CEP" className="input" onChange={(e) => setNewMember({ ...newMember, cep: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">🆔</span>
                <input placeholder="CPF" className="input" onChange={(e) => setNewMember({ ...newMember, cpf: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon">📱</span>
                <input placeholder="Celular" className="input" onChange={(e) => setNewMember({ ...newMember, celular: e.target.value })} />
              </label>

              <label className="input-group">
                <span className="icon"><IconEmail /></span>
                <input placeholder="E-mail" className="input" onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
              </label>

              <label className="input-group col-span-2">
                <span className="icon"><IconPlus /></span>
                <input placeholder="Produtos/Serviços" className="input" onChange={(e) => setNewMember({ ...newMember, produtos_servicos: e.target.value })} />
              </label>

              <label className="checkbox-inline col-span-2">
                <input type="checkbox" onChange={(e) => setNewMember({ ...newMember, outra_atividade: e.target.checked })} /> Desenvolve outra atividade além do empreendimento?
              </label>

              {newMember.outra_atividade && (
                <label className="input-group col-span-2">
                  <span className="icon">✏️</span>
                  <input placeholder="Descreva a outra atividade" className="input" onChange={(e) => setNewMember({ ...newMember, descricao_outra_atividade: e.target.value })} />
                </label>
              )}
            </div>

            <div className="row gap">
              <button type="button" onClick={handleAddMember} className="btn-secondary">
                <span className="btn-icon"><IconPlus /></span>
                Adicionar Membro
              </button>
            </div>
          </section>

          <ul className="member-list">
            {members.map((m, i) => (
              <li key={i} className="member-item">
                <div>
                  <strong>{m.nome_completo}</strong>
                  <div className="muted">{m.celular || m.email}</div>
                </div>
                <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="btn-ghost" aria-label={`Excluir ${m.nome_completo}`}>
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>

          <div className="row">
            <button disabled={members.length === 0} onClick={handleSaveGroup} className="btn-primary">
              Salvar Cadastro do Grupo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function VisualizacaoPage() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { data: groupData } = await supabase.from("groups").select("id").eq("user_id", user.id).single();
      if (!groupData) return;
      const { data: memberData } = await supabase.from("members").select("*").eq("group_id", groupData.id);
      setMembers(memberData || []);
    }
    load();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header small">
        <div className="brand">
          <div className="brand-badge">CS</div>
          <div>
            <h1>COMESOL</h1>
            <p className="subtitle">Visualização</p>
          </div>
        </div>
      </header>

      <main className="center-card">
        <div className="card large">
          <h2 className="card-title">Visualização do Cadastro</h2>
          <ul>
            {members.map((m, i) => (
              <li key={i} className="member-item">
                <div>
                  <strong>{m.nome_completo}</strong>
                  <div className="muted">{m.celular || m.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/visualizacao" element={<VisualizacaoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
