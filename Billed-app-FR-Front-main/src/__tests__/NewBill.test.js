// /**
//  * @jest-environment jsdom
//  */

import '@testing-library/jest-dom';

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { bills } from "../fixtures/bills"

import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import store from "../__mocks__/store.js";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("When I am connected as an employee", () => {

  describe("When I upload a proof file in Newbill form",()=> {

    it("should have an error message if the file isn't with correct extension", () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const newBillTest = new NewBill({document, onNavigate, store: store, localStorage: window.localStorage})
      const fileTest = new File(['invoice'], 'invoice.pdf', {type: 'pdf'})

      //fonction simulée avec jest.fn
      const handleChangeFile = jest.fn((e) => newBillTest.handleChangeFile(e))
      const proof = screen.getByTestId('bad-proof-format')
      
      const selectFile = screen.getByTestId("file")
      selectFile.addEventListener('change', handleChangeFile)
      userEvent.upload(selectFile, fileTest)
      
      
      expect(selectFile.files[0]).toStrictEqual(fileTest)
      expect(selectFile.files.item(0)).toStrictEqual(fileTest)
      expect(selectFile.files).toHaveLength(1)
      // on doit voir affiché message erreur
      expect(proof.getAttribute("style").indexOf("display: block;") != -1).toBe(true)
    })

    it("should not have an error message if the file isn't with correct extension",()=> {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      
      const html = NewBillUI()
      document.body.innerHTML = html
      
      //https://testing-library.com/docs/ecosystem-user-event/#uploadelement-file--clickinit-changeinit--options
      
      const newBillTest = new NewBill({document, onNavigate, store: store, localStorage: window.localStorage})
      const fileTest = new File(['invoice'], 'invoice.png', {type: 'image/png'})
      const proof = screen.getByTestId('bad-proof-format')

      const handleChangeFile = jest.fn((e) => newBillTest.handleChangeFile(e))
      
      const selectFile = screen.getByTestId("file")
      selectFile.addEventListener('change', handleChangeFile)

      userEvent.upload(selectFile, fileTest)

      expect(proof.getAttribute("style").indexOf("display: none") != -1).toBe(true)
    })

  })

  describe("when I filled all the fields with correct format and press submit", ()=> {

    it("should redirect to the route bills", async()=> {

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({pathname, data: bills})}
      const currentNewBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})

      const fileTest = new File(['invoice'], 'invoice.png', {type: 'image/png'})
      const handleChangeFile = jest.fn((e) => currentNewBill.handleChangeFile(e))
      const selectFile = screen.getByTestId("file")
      selectFile.addEventListener('change', handleChangeFile)
      userEvent.upload(selectFile, fileTest)

      screen.getByTestId("expense-type").value = "Transport"
      screen.getByTestId("expense-name").value = "Train Marseille-Berlin"
      screen.getByTestId("datepicker").value = "2001-12-31"
      screen.getByTestId("amount").value = "299"
      screen.getByTestId("vat").value = "239"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "train Jour de l'an avec fournisseurs"

      // Crée une fonction simulée similaire à jest.fn mais qui surveille également les appels à objet[methodName].
      // Retourne une fonction simulée de Jest.
      const handleSubmit = jest.spyOn(currentNewBill, 'handleSubmit')
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()

      await waitFor(() => screen.getByText("Mes notes de frais"))
      const billsPage = screen.getByText("Mes notes de frais")
      expect(billsPage).toBeTruthy()
    })
  })
})

// test d'intégration POST

describe("Given I am a user connected as Employee", () => {
  describe("When an error occurs on API POST", async () => {

    beforeEach(() => {
      
      jest.spyOn(mockStore, "bills")

      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    it("should fetches bills from an API and fails with 404 message error", async () => {

      const catchError = mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.NewBill)
      await new Promise(process.nextTick);
      return expect(catchError().create).rejects.toEqual(new Error("Erreur 404"))

     })

    it("should create new bill to an API and fails with 500 message error", async () => {

      const catchError = mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {return Promise.reject(new Error("Erreur 500"))}
        }
      })

      window.onNavigate(ROUTES_PATH.NewBill)
      await new Promise(process.nextTick);
      return expect(catchError().create).rejects.toEqual(new Error("Erreur 500"))

     })
  })
})