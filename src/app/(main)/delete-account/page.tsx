export default function DeleteAccountPage() {
  return <article className="mx-auto max-w-2xl space-y-6 px-6 py-12">
    <h1 className="text-3xl font-bold">Excluir sua conta do SoundScore</h1>
    <p>Você pode solicitar a exclusão sem reinstalar o aplicativo. Envie a solicitação a partir do e-mail da sua conta, informando seu nome de usuário. Nunca envie sua senha.</p>
    <a className="inline-block rounded-xl bg-[#722F37] px-5 py-3 text-white" href="mailto:contact@soundscore.com.br?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20da%20conta%20SoundScore">Solicitar exclusão por e-mail</a>
    <p>No aplicativo, acesse Configurações → Excluir conta. A exclusão remove seu perfil, resenhas, comentários, biblioteca e dados vinculados à conta. Registros necessários para segurança, análise de denúncias ou obrigações legais podem ser mantidos quando aplicável.</p>
    <p>A equipe verifica a titularidade antes de processar uma solicitação enviada por e-mail.</p>
  </article>;
}
