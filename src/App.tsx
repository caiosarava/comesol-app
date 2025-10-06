import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { supabase } from './lib/supabase';


function LoginPage() {
  const navigate = useNavigate();

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return;
    // Verifica se já existe cadastro
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: groupData } = await supabase.from("groups").select("id").eq("user_id", user.id).single();
    if (groupData) {
      navigate("/visualizacao");
    } else {
      navigate("/cadastro");
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-100 to-blue-100">
      <h1 className="text-2xl mb-4">Login COMESOL</h1>
      <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
        <input name="email" placeholder="E-mail" className="p-2 border rounded" required />
        <input type="password" name="password" placeholder="Senha" className="p-2 border rounded" required />
        <button type="submit" className="bg-green-600 text-white rounded p-2">Entrar</button>
      </form>
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
    <div className="p-6">
      <h2 className="text-xl mb-4">Cadastro do Grupo</h2>
      <div className="flex flex-col gap-2 mb-6">
        <input placeholder="Nome do Grupo" className="p-2 border rounded" onChange={(e) => setGroup({ ...group, nome_grupo: e.target.value })} />
        <input placeholder="Nome do Representante" className="p-2 border rounded" onChange={(e) => setGroup({ ...group, nome_representante: e.target.value })} />
        <input placeholder="E-mail de Contato" className="p-2 border rounded" onChange={(e) => setGroup({ ...group, email_contato: e.target.value })} />
        <label className="flex items-center gap-2">
          <input type="checkbox" onChange={(e) => setGroup({ ...group, possui_sede: e.target.checked })} /> Possui sede própria?
        </label>
        {group.possui_sede && (
          <input placeholder="Endereço Completo" className="p-2 border rounded" onChange={(e) => setGroup({ ...group, endereco: e.target.value })} />
        )}
      </div>

      <h3 className="text-lg mb-2">Adicionar Membro</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <input placeholder="Nome Completo" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, nome_completo: e.target.value })} />
        <input type="date" placeholder="Data de Nascimento" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, data_nascimento: e.target.value })} />
        <input placeholder="Nome da Mãe" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, nome_mae: e.target.value })} />
        <input placeholder="Endereço" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, endereco: e.target.value })} />
        <input placeholder="CEP" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, cep: e.target.value })} />
        <input placeholder="CPF" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, cpf: e.target.value })} />
        <input placeholder="Celular" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, celular: e.target.value })} />
        <input placeholder="E-mail" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
        <input placeholder="RG" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, rg: e.target.value })} />
        <input placeholder="MEI/CNPJ" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, mei_cnpj: e.target.value })} />

        <select className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, genero: e.target.value })}>
          <option value="">Selecione o gênero</option>
          <option>Homem cisgênero</option>
          <option>Mulher cisgênero</option>
          <option>Homem transgênero</option>
          <option>Mulher transgênero</option>
          <option>Não-Binário</option>
          <option>Outro</option>
        </select>

        <select className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, etnia: e.target.value })}>
          <option value="">Selecione a etnia/cor</option>
          <option>Branco</option>
          <option>Preto</option>
          <option>Pardo</option>
          <option>Amarelo</option>
          <option>Indígena</option>
        </select>

        <select className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, escolaridade: e.target.value })}>
          <option value="">Escolaridade</option>
          <option>Não alfabetizado</option>
          <option>Fundamental incompleto</option>
          <option>Fundamental completo</option>
          <option>Médio incompleto</option>
          <option>Médio completo</option>
          <option>Superior incompleto</option>
          <option>Superior completo</option>
          <option>Pós Graduação</option>
        </select>

        <input type="number" placeholder="Quantas pessoas moram na casa?" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, qtd_pessoas_casa: parseInt(e.target.value) })} />

        <input placeholder="Função no grupo" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, funcao_grupo: e.target.value })} />
        <input placeholder="Produtos/Serviços" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, produtos_servicos: e.target.value })} />
        <input placeholder="Matérias Primas" className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, materias_primas: e.target.value })} />

        <select className="p-2 border rounded" onChange={(e) => setNewMember({ ...newMember, renda_faixa: e.target.value })}>
          <option value="">Renda mensal no empreendimento</option>
          <option>até 1 salário mínimo</option>
          <option>1 a 2 salários mínimos</option>
          <option>2 a 3 salários mínimos</option>
          <option>3 a 4 salários mínimos</option>
          <option>mais de 4 salários mínimos</option>
        </select>

        <input placeholder="Envolvimento na economia solidária" className="p-2 border rounded col-span-2" onChange={(e) => setNewMember({ ...newMember, envolvimento_economia_solidaria: e.target.value })} />

        <label className="flex items-center gap-2 col-span-2">
          <input type="checkbox" onChange={(e) => setNewMember({ ...newMember, outra_atividade: e.target.checked })} /> Desenvolve outra atividade além do empreendimento?
        </label>
        {newMember.outra_atividade && (
          <input placeholder="Descreva a outra atividade" className="p-2 border rounded col-span-2" onChange={(e) => setNewMember({ ...newMember, descricao_outra_atividade: e.target.value })} />
        )}
      </div>
      <button onClick={handleAddMember} className="bg-blue-600 text-white rounded p-2">
        + Adicionar Membro
      </button>

      <ul className="mt-4">
        {members.map((m, i) => (
          <li key={i} className="flex justify-between border p-2 mb-2">
            <span>{m.nome_completo}</span>
            <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="text-red-600">Excluir</button>
          </li>
        ))}
      </ul>

      <button disabled={members.length === 0} onClick={handleSaveGroup} className="mt-6 bg-green-600 text-white rounded p-2">
        Salvar Cadastro do Grupo
      </button>
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
    <div className="p-6">
      <h2 className="text-xl mb-4">Visualização do Cadastro</h2>
      <ul>
        {members.map((m, i) => (
          <li key={i} className="border p-2 mb-2">{m.nome_completo}</li>
        ))}
      </ul>
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
