import { useTranslation } from "next-i18next"
import Link from "next/link"
import { FunctionComponent, useState } from "react"
import { Transaction } from "../../../types/Payment"
import Button from "../../Button"
import TransactionCancelButton from "./TransactionCancelButton"
import styles from "./TransactionListRow.module.scss"

interface RowProps {
  transaction: Transaction
}

const TransactionListRow: FunctionComponent<RowProps> = ({ transaction }) => {
  const { t, i18n } = useTranslation()

  const { created, updated, kind, value, status } = transaction

  // Status may change through interaction
  const [shownStatus, setStatus] = useState(status)

  const prettyCreated = new Date(created * 1000).toLocaleString(
    i18n.language.substring(0, 2),
  )
  const prettyUpdated = new Date(updated * 1000).toLocaleString(
    i18n.language.substring(0, 2),
  )
  const prettyValue = new Intl.NumberFormat(i18n.language.substring(0, 2), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  }).format(value / 100)

  const needsAttention = ["new", "retry"].includes(shownStatus)

  // Date object expects milliseconds since epoch
  return (
    <tr className={styles.row}>
      <td>{prettyCreated}</td>
      <td>{prettyUpdated}</td>
      <td>{t(`kind-${kind}`)}</td>
      <td>{prettyValue}</td>
      <td>{t(`status-${status}`)}</td>
      <td className={styles.actions}>
        <Link
          href={`/payment/${
            needsAttention ? transaction.id : `details/${transaction.id}`
          }`}
          passHref
        >
          <Button variant={needsAttention ? "primary" : "secondary"}>
            {needsAttention ? t("checkout") : t("view")}
          </Button>
        </Link>
        {needsAttention ? (
          <TransactionCancelButton
            id={transaction.id}
            onSuccess={() => setStatus("cancelled")}
          />
        ) : (
          <></>
        )}
      </td>
    </tr>
  )
}

export default TransactionListRow
