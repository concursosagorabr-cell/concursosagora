import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'vacancyByRole',
  title: 'Vagas por cargo',
  type: 'object',
  fields: [
    defineField({
      name: 'role',
      title: 'Cargo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'vacancies',
      title: 'Quantidade de vagas',
      type: 'number',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'salary',
      title: 'Salário (R$)',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'requirements',
      title: 'Requisitos',
      type: 'string',
      description: 'Ex.: ensino superior em Direito, OAB, CNH categoria B.',
    }),
  ],
  preview: {
    select: { title: 'role', vacancies: 'vacancies', salary: 'salary' },
    prepare({ title, vacancies, salary }) {
      const parts = [
        vacancies ? `${vacancies} vaga(s)` : null,
        salary ? `R$ ${Number(salary).toLocaleString('pt-BR')}` : null,
      ].filter(Boolean);
      return { title: title || 'Cargo', subtitle: parts.join(' • ') };
    },
  },
});
