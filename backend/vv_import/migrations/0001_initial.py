from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='RegistroImportVV',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_archivo', models.CharField(max_length=255)),
                ('respuestas', models.IntegerField()),
                ('n_avisos', models.IntegerField(default=0)),
                ('valido', models.BooleanField(default=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Registro de importación VV',
                'verbose_name_plural': 'Registros de importación VV',
                'ordering': ['-creado_en'],
            },
        ),
    ]
