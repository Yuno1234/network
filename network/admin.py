from django.contrib import admin

from .models import *

class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "timestamp", "text")

class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "bio", "icon", "banner")

# Register your models here.
admin.site.register(User)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Post, PostAdmin)