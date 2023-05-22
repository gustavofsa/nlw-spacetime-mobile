import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from '@expo/vector-icons/Feather'
import {
  MediaTypeOptions,
  PermissionStatus,
  launchImageLibraryAsync,
  useCameraPermissions,
} from 'expo-image-picker'
import * as SecureStore from 'expo-secure-store'

import NLWLogo from '../src/assets/nlw-spacetime-logo.svg'
import { api } from '../src/assets/lib/api'

interface MediaPreview {
  mediaType: string
  previewUri: string
}

export default function NewMemory() {
  const { bottom, top } = useSafeAreaInsets()
  const [cameraPermission, requestPermission] = useCameraPermissions()
  const router = useRouter()

  const [preview, setPreview] = useState<MediaPreview | null>(null)
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  async function verifyPermission() {
    if (cameraPermission.status === PermissionStatus.UNDETERMINED) {
      const permissionResponse = await requestPermission()

      return permissionResponse.granted
    }

    if (cameraPermission.status === PermissionStatus.DENIED) {
      Alert.alert(
        'Não foi possível acessar a câmera.',
        'Para adicionar uma foto ou vídeo de capa você precisa permitir o acesso a câmera nas configuações do app.',
      )

      return false
    }

    return true
  }

  async function openImagePicker() {
    try {
      const hasCameraPermission = await verifyPermission()

      if (!hasCameraPermission) {
        return
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.All,
        quality: 1,
      })

      if (result.assets[0]) {
        const { type, uri } = result.assets[0]

        setPreview({ mediaType: type, previewUri: uri })
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateMemory() {
    const token = await SecureStore.getItemAsync('token')

    let coverUrl = ''

    if (preview) {
      const uploadFormData = new FormData()

      uploadFormData.append('file', {
        uri: preview.previewUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as any)

      const uploadResponse = await api.post('/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      coverUrl = uploadResponse.data.fileUrl
    }

    await api.post(
      '/memories',
      {
        content,
        isPublic,
        coverUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    router.push('/memories')
  }

  return (
    <ScrollView
      className="flex-1 px-8"
      contentContainerStyle={{ paddingBottom: bottom, paddingTop: top }}
    >
      <View className="mt-5 flex-row items-center justify-between">
        <NLWLogo />

        <Link href="/memories" asChild>
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-full bg-purple-500"
          >
            <Icon name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <View className="mt-6 space-y-6">
        <View className="flex-row items-center gap-2">
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            thumbColor={isPublic ? '#9b79ea' : '#9e9ea0'}
            trackColor={{
              false: '#56565a',
              true: '#372560',
            }}
          />
          <Text className="font-body text-base text-gray-200">
            Tornar memória pública
          </Text>
        </View>

        <TouchableOpacity
          onPress={openImagePicker}
          activeOpacity={0.7}
          className="h-32 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-black/20"
        >
          {preview ? (
            // Implement video preview using react-native-video
            <ImageBackground
              source={{ uri: preview.previewUri }}
              className="h-full w-full rounded-lg object-cover"
              imageStyle={{ borderRadius: 5 }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPreview(null)}
                className="absolute right-[-10] top-[-20] rounded-full bg-gray-900 px-3 py-3"
              >
                <Icon name="trash" size={16} color="#b54129" />
              </TouchableOpacity>
            </ImageBackground>
          ) : (
            <View className="flex-row items-center gap-2">
              <Icon name="image" color="#fff" />
              <Text className="font-body text-sm text-gray-200">
                Adicionar foto ou vídeo de capa
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          multiline
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
          className="p-0 font-body text-lg text-gray-50"
          placeholderTextColor="#56565a"
          placeholder="Fique livre para adicionar fotos, vídeos e relatos sobre essa experiência que você quer lembrar para sempre."
        />

        <TouchableOpacity
          onPress={handleCreateMemory}
          activeOpacity={0.7}
          className="items-center self-end rounded-full bg-green-500 px-5 py-2"
        >
          <Text className="font-alt text-sm uppercase text-black">Salvar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
