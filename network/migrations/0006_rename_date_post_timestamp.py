# Generated by Django 4.1.3 on 2022-12-23 06:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0005_alter_post_likes'),
    ]

    operations = [
        migrations.RenameField(
            model_name='post',
            old_name='date',
            new_name='timestamp',
        ),
    ]
