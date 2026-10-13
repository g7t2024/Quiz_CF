# Aprova — Quiz de concursos

Abra `index.html` em um navegador moderno. Não exige instalação, internet ou servidor.

## Arquivos
- index.html: estrutura e diálogos acessíveis
- styles.css: layout responsivo, temas e animações
- app.js: sorteio, persistência, interação e gráfico
- questions.js: banco completo, editável, de 1.000 questões

## Banco e fontes
Banco autoral educativo, não extraído de provas: 100 perguntas diretas e 900 exercícios de associação distintos entre 100 conceitos constitucionais. As associações revisitam os conceitos; não representam 1.000 assuntos diferentes. Cada questão tem cinco alternativas, uma resposta correta, explicação e referência.

Referência principal: Constituição Federal, texto compilado oficial do Planalto:
https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm

Composição da Câmara (513), fonte institucional consultada em 13/10/2026:
https://www2.camara.leg.br/transparencia/acesso-a-informacao/copy_of_perguntas-frequentes/deputados

Senado:
https://www12.senado.leg.br/perguntas-frequentes

## Funcionamento
Cada rodada seleciona 20 questões ainda não respondidas. A escolha de alternativa é definitiva e mostra o gabarito e a explicação, permitindo contabilizar acertos e erros reais. O botão “Novo quiz” preserva o histórico do banco. Questões abandonadas e não respondidas continuam disponíveis. O progresso é local ao navegador e endereço; se o armazenamento for bloqueado, a experiência continua na sessão e exibe aviso.

Ao responder as 1.000 questões, há confetes e mensagem final. Depois, uma nova rodada reinicia o ciclo do banco. “Limpar progresso” permite reiniciar manualmente, mediante confirmação. Temas e rodada atual são persistidos. Não há coleta de dados ou dependências externas.

O gráfico usa CSS e texto acessível; não requer bibliotecas. Animações respeitam a preferência por movimento reduzido.

## Atualização
Edite `questions.js` para ajustar conteúdo ou acrescentar questões, mantendo IDs únicos e uma alternativa correta por questão. Ao alterar o banco, atualize `BANK_VERSION` em `app.js` para invalidar o progresso antigo. Revise a legislação e os editais do concurso ao atualizar este material.
