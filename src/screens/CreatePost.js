import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { useForm } from '../utilities/hooks'
import { useSession } from '../context'
import { makeNotEmptyChecker } from '../utilities/validators'
import { requestServer } from '../utilities/requests'
import uuid from 'react-native-uuid'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import TextField from '../components/TextField'
import TextArea from '../components/TextArea'
import MultimediaAdder from '../components/MultimediaAdder'
import VividIconButton from '../components/VividIconButton'
import Padder from '../components/Padder'
import Scroller from '../components/Scroller'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native'
import { Chip, Divider } from 'react-native-paper'

const styles = StyleSheet.create({
  title: {
    fontSize: 35,
    color: "#344340",
    fontWeight: "bold",
    display: "flex",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "gray",
    display: "flex",
    textAlign: "center",
  },
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
    width: "100%"
  },
  generalInformationSection: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    width: "100%"
  },
  categoriesSection: {
    padding: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    width: "100%"
  },
  categoriesDisplay: {
    gap: 10
  },
  multimediaSection: {
    padding: 35,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    width: "100%"
  }
})

const createPost = async (
  storeId,
  categories,
  multimedia,
  generalInformation
) => {
  console.log("createPost", storeId)
  const payload = {
    store_id: storeId,
    categories,
    multimedia,
    ...generalInformation
  }
  const _ = await requestServer(
    "/posts_service/create_post",
    payload
  )
}

const GeneralInformationSection = ({ form }) => {
  return (
    <View style={styles.generalInformationSection}>
      <TextField
        value={form.getField("title")}
        onChangeText={form.setField("title")}
        error={form.getError("title")}
        placeholder="Título"
      />

      <TextArea
        value={form.getField("description")}
        onChangeText={form.setField("description")}
        error={form.getError("description")}
        placeholder="Descripción"
      />
    
      <TextField
        value={form.getField("price")}
        onChangeText={form.setField("price")}
        error={form.getError("price")}
        placeholder="Precio"
        keyboardType="numeric"
      />

      <TextField
        value={form.getField("amount")}
        onChangeText={form.setField("amount")}
        error={form.getError("amount")}
        placeholder="Cantidad de unidades"
        keyboardType="numeric"
      />
    </View>
  )
}

const CategoriesSection = ({ categories, setCategories }) => {
  const [currentCategory, setCurrentCategory] = useState("")

  const handleAddCategory = () => {
    const newCategories = [currentCategory, ...categories]

    setCategories(newCategories)
    setCurrentCategory("")
  }

  const handleDeleteCategory = (category) => {
    const newCategories = categories.filter((c) => c !== category)

    setCategories(newCategories)
  }

  const categoriesChips = categories.map((c) => {
    return (
      <Chip
        key={uuid.v4()}
        icon="shape"
        closeIcon="close"
        onClose={() => handleDeleteCategory(c)}
      >
        {c}
      </Chip>
    )
  })

  return (
    <View style={styles.categoriesSection}>
      <Text style={styles.subtitle}>
        Añade categorías a tu producto
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          rowGap: 15
        }}
      >
        <TextField
          value={currentCategory}
          onChangeText={setCurrentCategory}
          placeholder="Categoría"
        />

        <VividIconButton
          icon="plus"
          onPress={handleAddCategory}
        />
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.categoriesDisplay}
      >
        {categoriesChips}
      </ScrollView>
    </View>
  )
}

const MultimediaSection = ({ multimedia, setMultimedia }) => {
  return (
    <View style={styles.multimediaSection}>
      <Text style={styles.subtitle}>
        Añade fotos que describan a tu producto
      </Text>

      <MultimediaAdder
        multimedia={multimedia}
        setMultimedia={setMultimedia}
      />
    </View>
  )
}

export default () => {
  const navigation = useNavigation()
  const [session, _] = useSession()

  const [categories, setCategories] = useState([])
  const [multimedia, setMultimedia] = useState([])

  const handleCreatePostSuccess = () => {
    Alert.alert(
      "Éxito",
      "Tu publicación se ha realizado con éxito"
    )

    navigation.goBack()
  }

  const handleSubmit = () => {
    if (!form.validate()) {
      return
    }

    console.log("SESSION DATA", session.data.storeId)

    createPostMutation.mutate({
      storeId: session.data.storeId,
      categories,
      multimedia,
      generalInformation: {
        ...form.fields,
        amount: Number(form.fields.amount),
        price: Number(form.fields.price)
      }
    })
  }

  const form = useForm(
    {
      title: "",
      description: "",
      amount: "1",
      price: "301"
    },
    {
      title: makeNotEmptyChecker("Título vacío"),
      description: () => null,
      amount: (value) => value <= 0 ? "Cantidad de unidades inválida" : null,
      price: (value) => value <= 300 ? "El precio tiene que ser mayor a ₡300" : null
    }
  )
  const createPostMutation = useMutation(
    ({
      storeId,
      categories,
      multimedia,
      generalInformation
    }) => createPost(
      storeId,
      categories,
      multimedia,
      generalInformation
    ),
    {
      onSuccess: handleCreatePostSuccess
    }
  )

  return (
    <Scroller>
      <KeyboardAwareScrollView>
        <Padder>
            <View style={styles.container}>
              <Text style={styles.title}>
                Haz una publicación
              </Text>

              <GeneralInformationSection
                form={form}
              />

              <Divider style={{ width: "90%" }} />

              <CategoriesSection
                categories={categories}
                setCategories={setCategories}
              />

              <Divider style={{ width: "90%" }} />

              <View>
                <MultimediaSection
                  multimedia={multimedia}
                  setMultimedia={setMultimedia}
                />
              </View>

              <Divider style={{ width: "90%" }} />

              <Button
                onPress={handleSubmit}
              >
                {
                  createPostMutation.isLoading ?
                  <LoadingSpinner /> :
                  "Publicar"
                }
              </Button>
            </View>
        </Padder>
      </KeyboardAwareScrollView>
    </Scroller>
  )
}
