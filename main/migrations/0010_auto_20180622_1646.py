# Generated by Django 2.0.6 on 2018-06-22 15:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0009_auto_20180620_2224'),
    ]

    operations = [
        migrations.CreateModel(
            name='BusStopAddress',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stopid', models.IntegerField(null=True)),
                ('address', models.TextField(null=True)),
            ],
            options={
                'verbose_name_plural': 'Bus Stop Address',
            },
        ),
        migrations.AddIndex(
            model_name='busstopaddress',
            index=models.Index(fields=['stopid'], name='main_bussto_stopid_dc8deb_idx'),
        ),
        migrations.AddIndex(
            model_name='busstopaddress',
            index=models.Index(fields=['address'], name='main_bussto_address_ac1585_idx'),
        ),
        migrations.AddIndex(
            model_name='busstopaddress',
            index=models.Index(fields=['stopid', 'address'], name='main_bussto_stopid_747879_idx'),
        ),
    ]
