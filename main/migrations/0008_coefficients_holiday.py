# Generated by Django 2.0.6 on 2018-08-14 11:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0007_auto_20180805_1251'),
    ]

    operations = [
        migrations.AddField(
            model_name='coefficients',
            name='holiday',
            field=models.FloatField(null=True),
        ),
    ]
